import base64
import io
from PIL import Image

src = Image.open('public/logo.png')

# 1. Multi-resolution ICO for browser & Google
src.save('public/favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])

# 2. Next.js file-based app icon (PNG)
src.resize((32, 32), Image.Resampling.LANCZOS).save('src/app/icon.png', format='PNG')

# 3. Apple Touch Icon (180x180)
src.resize((180, 180), Image.Resampling.LANCZOS).save('public/apple-touch-icon.png', format='PNG')

# 4. High-res PWA icons
src.resize((192, 192), Image.Resampling.LANCZOS).save('public/icon-192.png', format='PNG')
src.resize((512, 512), Image.Resampling.LANCZOS).save('public/icon-512.png', format='PNG')

# 5. Embed in icon.svg so any SVG requests display the real logo
thumb = src.resize((256, 256), Image.Resampling.LANCZOS)
buf = io.BytesIO()
thumb.save(buf, format='PNG', optimize=True)
b64 = base64.b64encode(buf.getvalue()).decode('utf-8')

svg = (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">\n'
    '  <rect width="256" height="256" rx="54" fill="#070b13" />\n'
    f'  <image href="data:image/png;base64,{b64}" x="16" y="16" width="224" height="224" />\n'
    '</svg>\n'
)

with open('src/app/icon.svg', 'w', encoding='utf-8') as f:
    f.write(svg)

print('All favicon and logo icons successfully generated from public/logo.png!')
