import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search as SearchIcon,
  X,
  FileText,
  Clock,
  Tag,
  User,
  Folder,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { api } from "../api.js";

interface SearchResult {
  _id: string;
  title: string;
  description?: string;
  category: string;
  ownerName: string;
  tags: string[];
  status: string;
  verificationStatus: string;
  isArchived: boolean;
  isFavorite: boolean;
  createdAt: string;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<any>(null);

  // Load recent searches on mount
  useEffect(() => {
    const stored = localStorage.getItem("recentSearches");
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.globalSearch(searchQuery, { includeShared: true }, 1, 10);
      setResults(response.documents);
      
      // Get suggestions
      const suggestionsResponse = await api.getSearchSuggestions(searchQuery);
      setSuggestions(suggestionsResponse);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        performSearch(query);
      }, 300);
    } else {
      setResults([]);
      setSuggestions([]);
    setShowSuggestions(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, performSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(-1);
    setShowSuggestions(e.target.value.trim().length >= 2);
  };

  const handleResultClick = (_result: SearchResult) => {
    // Save to recent searches
    const updatedRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updatedRecent);
    localStorage.setItem("recentSearches", JSON.stringify(updatedRecent));

    navigate(`/documents`);
    onClose();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    performSearch(suggestion);
  };

  const handleRecentSearchClick = (searchTerm: string) => {
    setQuery(searchTerm);
    performSearch(searchTerm);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = showSuggestions ? suggestions : results;
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      if (showSuggestions) {
        handleSuggestionClick(suggestions[selectedIndex]);
      } else {
        handleResultClick(results[selectedIndex]);
      }
    }
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight || highlight.length < 2) return text;
    
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="search-highlight">{part}</mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "certificate":
        return <FileText size={16} className="text-blue-500" />;
      case "contract":
        return <FileText size={16} className="text-purple-500" />;
      case "identity":
        return <User size={16} className="text-green-500" />;
      case "invoice":
        return <FileText size={16} className="text-amber-500" />;
      case "report":
        return <FileText size={16} className="text-cyan-500" />;
      default:
        return <Folder size={16} className="text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-700",
      verified: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  if (!isOpen) return null;

  return (
    <div className="search-backdrop" onClick={onClose}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-input-wrapper">
          <SearchIcon size={20} className="search-icon" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Search documents, tags, owners..."
            className="search-input"
            autoFocus
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setResults([]);
                setSuggestions([]);
                setShowSuggestions(false);
                inputRef.current?.focus();
              }}
              className="search-clear"
            >
              <X size={18} />
            </button>
          )}
          <kbd className="search-shortcut">ESC</kbd>
        </div>

        <div className="search-content" ref={resultsRef}>
          {isLoading ? (
            <div className="search-loading">
              <Loader2 size={24} className="animate-spin" />
              <span>Searching...</span>
            </div>
          ) : query.trim().length < 2 ? (
            <>
              {recentSearches.length > 0 && (
                <div className="search-section">
                  <div className="search-section-header">
                    <Clock size={16} />
                    <span>Recent Searches</span>
                    <button onClick={clearRecentSearches} className="search-clear-recent">
                      Clear
                    </button>
                  </div>
                  <div className="search-recent-list">
                    {recentSearches.map((searchTerm, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecentSearchClick(searchTerm)}
                        className={`search-recent-item ${selectedIndex === index ? "selected" : ""}`}
                      >
                        <Clock size={14} />
                        {searchTerm}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="search-empty">
                <SearchIcon size={48} className="text-[var(--text-muted)]" />
                <p>Type at least 2 characters to search</p>
                <div className="search-tips">
                  <div className="search-tip">
                    <kbd>⌘</kbd>
                    <kbd>K</kbd>
                    <span>Open search</span>
                  </div>
                  <div className="search-tip">
                    <kbd>↑</kbd>
                    <kbd>↓</kbd>
                    <span>Navigate</span>
                  </div>
                  <div className="search-tip">
                    <kbd>↵</kbd>
                    <span>Select</span>
                  </div>
                  <div className="search-tip">
                    <kbd>ESC</kbd>
                    <span>Close</span>
                  </div>
                </div>
              </div>
            </>
          ) : showSuggestions && suggestions.length > 0 ? (
            <div className="search-section">
              <div className="search-section-header">
                <SearchIcon size={16} />
                <span>Suggestions</span>
              </div>
              <div className="search-suggestions-list">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`search-suggestion-item ${selectedIndex === index ? "selected" : ""}`}
                  >
                    <SearchIcon size={14} />
                    {highlightText(suggestion, query)}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="search-empty">
              <SearchIcon size={48} className="text-[var(--text-muted)]" />
              <p>No results found for "{query}"</p>
            </div>
          ) : (
            <div className="search-results">
              <div className="search-results-header">
                <span>{results.length} results</span>
              </div>
              {results.map((result, index) => (
                <button
                  key={result._id}
                  onClick={() => handleResultClick(result)}
                  className={`search-result-item ${selectedIndex === index ? "selected" : ""}`}
                >
                  <div className="search-result-icon">
                    {getCategoryIcon(result.category)}
                  </div>
                  <div className="search-result-content">
                    <div className="search-result-title">
                      {highlightText(result.title, query)}
                    </div>
                    {result.description && (
                      <div className="search-result-description">
                        {highlightText(result.description, query)}
                      </div>
                    )}
                    <div className="search-result-meta">
                      <span className="search-result-category">{result.category}</span>
                      <span className="search-result-owner">
                        <User size={12} />
                        {result.ownerName}
                      </span>
                      {result.tags.length > 0 && (
                        <span className="search-result-tags">
                          <Tag size={12} />
                          {result.tags.slice(0, 2).join(", ")}
                          {result.tags.length > 2 && ` +${result.tags.length - 2}`}
                        </span>
                      )}
                      <span className={`search-result-status ${getStatusBadge(result.status)}`}>
                        {result.status}
                      </span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="search-result-arrow" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
