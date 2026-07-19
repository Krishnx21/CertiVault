{{/*
=============================================================================
CertiVault Helm Chart — Template Helpers
=============================================================================
*/}}

{{/*
Expand the name of the chart.
*/}}
{{- define "certivault.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
Truncated to 63 chars (Kubernetes label limit).
*/}}
{{- define "certivault.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Chart label: name-version
*/}}
{{- define "certivault.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels applied to every resource.
*/}}
{{- define "certivault.labels" -}}
helm.sh/chart: {{ include "certivault.chart" . }}
app.kubernetes.io/name: {{ include "certivault.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: certivault
{{- end }}

{{/*
Selector labels — used by Deployment.spec.selector.matchLabels
and Service.spec.selector. Must be IMMUTABLE after first deploy.
*/}}
{{- define "certivault.selectorLabels" -}}
app.kubernetes.io/name: {{ include "certivault.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Component-scoped selector labels.
Usage: {{ include "certivault.componentSelectorLabels" (dict "root" . "component" "backend") }}
*/}}
{{- define "certivault.componentSelectorLabels" -}}
app.kubernetes.io/name: {{ include "certivault.name" .root }}
app.kubernetes.io/instance: {{ .root.Release.Name }}
app.kubernetes.io/component: {{ .component }}
{{- end }}

{{/*
Image reference for the backend.
Usage: {{ include "certivault.backendImage" . }}
*/}}
{{- define "certivault.backendImage" -}}
{{- printf "%s/%s:%s" .Values.image.registry .Values.image.backend.repository .Values.image.backend.tag }}
{{- end }}

{{/*
Image reference for the frontend.
*/}}
{{- define "certivault.frontendImage" -}}
{{- printf "%s/%s:%s" .Values.image.registry .Values.image.frontend.repository .Values.image.frontend.tag }}
{{- end }}

{{/*
ConfigMap name.
*/}}
{{- define "certivault.configMapName" -}}
{{- printf "%s-config" (include "certivault.fullname" .) }}
{{- end }}

{{/*
Secret name.
*/}}
{{- define "certivault.secretName" -}}
{{- printf "%s-secrets" (include "certivault.fullname" .) }}
{{- end }}

{{/*
Namespace — uses .Values.namespace, falling back to .Release.Namespace.
*/}}
{{- define "certivault.namespace" -}}
{{- default .Release.Namespace .Values.namespace }}
{{- end }}

{{/*
Standard envFrom block (ConfigMap + Secret).
Reused by backend, frontend, and workers containers.
*/}}
{{- define "certivault.envFrom" -}}
- configMapRef:
    name: {{ include "certivault.configMapName" . }}
- secretRef:
    name: {{ include "certivault.secretName" . }}
{{- end }}

{{/*
Pod security context from values.podSecurityContext.
*/}}
{{- define "certivault.podSecurityContext" -}}
{{- with .Values.podSecurityContext }}
runAsNonRoot: {{ .runAsNonRoot }}
runAsUser: {{ .runAsUser }}
runAsGroup: {{ .runAsGroup }}
fsGroup: {{ .fsGroup }}
{{- end }}
{{- end }}
