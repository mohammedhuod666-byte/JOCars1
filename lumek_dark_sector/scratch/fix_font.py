with open('fonts/moha/moha.yy', 'r', encoding='utf-8') as f:
    text = f.read()

# Make dfgh from moha
text = text.replace('"moha"', '"dfgh"')
text = text.replace('"name":"moha"', '"name":"dfgh"')
text = text.replace('"regenerateBitmap":false', '"regenerateBitmap":true')
text = text.replace('Cascadia Mono Light', 'Arial')

# Add ranges
ranges = '''"ranges":[
    {"lower":32,"upper":127,},
    {"lower":1536,"upper":1791,},
    {"lower":65136,"upper":65279,},
    {"lower":9647,"upper":9647,},
  ],'''

import re
text = re.sub(r'"ranges":\[.*?\]\,', ranges, text, flags=re.DOTALL)

with open('fonts/dfgh/dfgh.yy', 'w', encoding='utf-8') as f:
    f.write(text)
print('Restored dfgh.yy using string replace.')
