Hi @Krishnx21! 👋 I've submitted this PR to resolve issue #25 by implementing a robust Event-Driven Architecture (EDA) across the core modules.

### 🔍 Technical Analysis (L3 Core/Architecture Justification):
This PR directly tackles **Core Backend Architecture**, which strictly satisfies the **Level 3** criteria for the ECSoC '26 program:
1. **Architectural Restructuring:** Transitioned the application away from tight coupling between independent modules. The `dashboard` module no longer directly queries the database or depends on `documentStore` for aggregations, completely removing the heavy dependency cycle.
2. **Decoupled Observer Pattern:** Created a strongly-typed, centralized `EventBus` using Node's `EventEmitter` to broadcast events (`documentCreated`, `documentUpdated`, `documentDeleted`).
3. **Performance/State Management:** The dashboard now acts as an async observer, intelligently maintaining an in-memory `summaryState` and regenerating data only upon relevant `eventBus` triggers, rather than performing aggressive collection-wide aggregations per HTTP request.

Since this fundamentally reorganizes the interaction boundaries between key backend modules (Dashboard ↔ Documents) and implements the requested Observer pattern, I kindly request the maintainers to review this as an **L3 Contribution** and apply the `ECSoC26`, `Level 3`, and `good-backend` labels!

Looking forward to your feedback! 🚀
