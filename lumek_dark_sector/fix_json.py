import os
import re

def fix_trailing_commas(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace trailing commas before }
    new_content = re.sub(r',\s*\}', '}', content)
    # Replace trailing commas before ]
    new_content = re.sub(r',\s*\]', ']', new_content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed {filepath}")

for root, dirs, files in os.walk('.'):
    for file in files:
        if file.endswith('.yy'):
            fix_trailing_commas(os.path.join(root, file))

print("Done.")
