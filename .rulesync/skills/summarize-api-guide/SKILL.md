---
name: summarize-api-guide
description: 'Summarize API Guide - When the user asks to summarize a list of APIs'
targets: ['*']
---

Summarize a provided list of APIs in the required format. For each API, include:

1. **Method**: HTTP method.
2. **Full Path**: Full URL path.
3. **Params or Body**:
   - **Params**: Query parameters or path variables with details.
   - **Body**: Full DTO/interface definition with comments for non-obvious fields or constraints.
4. **Response Interface**: Full interface/JSON structure with nested objects and field descriptions.

Use the exact section order above. Keep outputs concise but complete; show full DTOs and response shapes with comments where helpful.
