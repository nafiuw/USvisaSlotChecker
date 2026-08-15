from PIL import Image
from pathlib import Path

asset_dir = Path('/home/ubuntu/visa-slot-extension/assets')
master = Image.open(asset_dir / 'icon-128.png').convert('RGBA')
for size in (16, 32, 48, 128):
    resized = master.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(asset_dir / f'icon-{size}.png')
