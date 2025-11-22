#!/usr/bin/env python3
"""
Fix generated forms to remove dependencies and simplify
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from run_task import execute_prompt

PROJECT_ROOT = Path(__file__).parent.parent.parent

forms_to_fix = [
    {
        "name": "DamagePhotosForm",
        "file": "src/components/reports/DamagePhotosForm.tsx",
        "issues": ["Uses Spinner component that doesn't exist", "Uses VoiceInput that doesn't exist", "Uses optimizeImage function"]
    },
    {
        "name": "PreStartChecklistForm",
        "file": "src/components/reports/PreStartChecklistForm.tsx",
        "issues": ["Uses react-hook-form Controller and useForm", "Uses VoiceInput that doesn't exist"]
    },
    {
        "name": "TrafficManagementPlanChecklistForm",
        "file": "src/components/reports/TrafficManagementPlanChecklistForm.tsx",
        "issues": ["Uses VoiceInput that doesn't exist"]
    }
]

# Read existing working form as reference
reference_form = PROJECT_ROOT / "src/components/reports/SiteRecordForm.tsx"
with open(reference_form, 'r', encoding='utf-8') as f:
    reference_code = f.read()

for form in forms_to_fix:
    file_path = PROJECT_ROOT / form['file']
    with open(file_path, 'r', encoding='utf-8') as f:
        current_code = f.read()

    prompt = f"""Fix this TypeScript React form component by removing dependencies that don't exist.

**Form:** {form['name']}
**Current Issues:**
{chr(10).join(f'- {issue}' for issue in form['issues'])}

**Reference Form (Working Example):**
```tsx
{reference_code[:2000]}
```

**Current Broken Code:**
```tsx
{current_code}
```

**Fix Requirements:**
1. Remove all references to Spinner - just use text "Loading..."
2. Remove all VoiceInput components - just use standard textarea/input
3. Remove optimizeImage - use simple file reader with base64
4. Remove react-hook-form (Controller, useForm) - use simple useState
5. Keep the same interface and props
6. Keep all TypeScript types
7. Keep the same layout and styling
8. Must work with just React useState/useEffect

**Output:**
Provide ONLY the complete fixed TypeScript React component code.
NO explanations, NO markdown formatting, just pure TSX code.
