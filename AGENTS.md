# Technical Decisions

- Keep Lovable AI Gateway calls inside Edge Functions and use the typed `@lovable.dev/ai-gateway` SDK so credentials remain server-side and request contracts stay model-specific.