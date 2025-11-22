#!/usr/bin/env python3
"""
Sprint 4 Completion - Generate all missing QA forms and integrate components
"""

import os
import sys
from pathlib import Path

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent))

from run_task import execute_prompt, get_worker

PROJECT_ROOT = Path(__file__).parent.parent.parent

# Missing forms to generate
MISSING_FORMS = [
    {
        "name": "SprayReportForm",
        "original_path": "archive/readme/sga-qa-pack (Original Code) (Readme)/components/forms/SprayReportForm.tsx",
        "output_path": "src/components/reports/SprayReportForm.tsx",
        "worker": "qwen",
        "description": "Spray seal report form with runs, environmental conditions, and product details"
    },
    {
        "name": "DamagePhotosForm",
        "original_path": "archive/readme/sga-qa-pack (Original Code) (Readme)/components/forms/DamagePhotosForm.tsx",
        "output_path": "src/components/reports/DamagePhotosForm.tsx",
        "worker": "qwen",
        "description": "Form for capturing and documenting damage photos with descriptions"
    },
    {
        "name": "PreStartChecklistForm",
        "original_path": "archive/readme/sga-qa-pack (Original Code) (Readme)/components/forms/PreStartChecklistForm.tsx",
        "output_path": "src/components/reports/PreStartChecklistForm.tsx",
        "worker": "qwen",
        "description": "Pre-start safety checklist for equipment and site readiness"
    },
    {
        "name": "TrafficManagementPlanChecklistForm",
        "original_path": "archive/readme/sga-qa-pack (Original Code) (Readme)/components/forms/TrafficManagementPlanChecklistForm.tsx",
        "output_path": "src/components/reports/TrafficManagementPlanChecklistForm.tsx",
        "worker": "qwen",
        "description": "Traffic management plan checklist for site safety compliance"
    }
]

def read_original_form(form_path: str) -> str:
    """Read the original form file"""
    full_path = PROJECT_ROOT / form_path
    if not full_path.exists():
        return ""

    with open(full_path, 'r', encoding='utf-8') as f:
        return f.read()

def generate_form(form_config: dict) -> str:
    """Generate a form based on the original"""

    original_code = read_original_form(form_config["original_path"])

    if not original_code:
        print(f"  [WARN] Original file not found: {form_config['original_path']}")
        return ""

    prompt = f"""You are replicating a QA form from an existing application to a new codebase.

**Form to Replicate:** {form_config['name']}
**Description:** {form_config['description']}

**Original Form Code:**
```tsx
{original_code}
```

**Requirements:**
1. Replicate ALL fields and functionality from the original form
2. Use modern React hooks (useState, useEffect)
3. Use Tailwind CSS for styling (similar to the original dark mode support)
4. Maintain the same data structure and validation logic
5. Keep all calculated fields (auto-calculations, totals, etc.)
6. Preserve form sections and layout
7. Use TypeScript with proper interfaces
8. Make it compatible with the current codebase structure

**Current Codebase Context:**
- Forms are in src/components/reports/
- We use Tailwind CSS
- We have PhotoCapture component for images
- We have SignaturePad component for signatures
- We use react-hook-form for form validation where needed

**Output:**
Provide ONLY the complete TypeScript React component code, ready to save as `{form_config['output_path']}`.
Do NOT include explanations, just the code.
"""

    system_prompt = "You are an expert React/TypeScript developer specializing in form replication and data integrity."

    print(f"  Generating {form_config['name']}...")
    result = execute_prompt(form_config['worker'], prompt, system_prompt)

    return result

def save_generated_form(form_config: dict, code: str):
    """Save the generated form to the output path"""
    output_path = PROJECT_ROOT / form_config['output_path']
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Clean up the code (remove markdown code blocks if present)
    clean_code = code
    if "```tsx" in code or "```typescript" in code:
        # Extract code from markdown
        lines = code.split('\n')
        code_lines = []
        in_code_block = False
        for line in lines:
            if line.strip().startswith('```'):
                in_code_block = not in_code_block
                continue
            if in_code_block:
                code_lines.append(line)
        clean_code = '\n'.join(code_lines)

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(clean_code)

    print(f"  [OK] Saved to {form_config['output_path']}")

def main():
    print("=" * 60)
    print("SGA QA System - Sprint 4 Completion")
    print("Generating Missing Forms")
    print("=" * 60)

    print(f"\nForms to generate: {len(MISSING_FORMS)}")
    for form in MISSING_FORMS:
        print(f"  - {form['name']}")

    print("\n" + "-" * 60)

    for i, form in enumerate(MISSING_FORMS, 1):
        print(f"\n[{i}/{len(MISSING_FORMS)}] {form['name']}")
        print(f"  Worker: {form['worker']}")

        try:
            code = generate_form(form)
            if code:
                save_generated_form(form, code)
                print(f"  [OK] {form['name']} completed")
            else:
                print(f"  [FAIL] {form['name']} failed - no code generated")
        except Exception as e:
            print(f"  [FAIL] {form['name']} failed: {e}")

    print("\n" + "=" * 60)
    print("Form Generation Complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()
