from pathlib import Path
from PIL import Image

source = Path('/home/ubuntu/webdev-static-assets/taskflow-icon.png')
outputs = [
    Path('/home/ubuntu/taskflow/assets/images/icon.png'),
    Path('/home/ubuntu/taskflow/assets/images/splash-icon.png'),
    Path('/home/ubuntu/taskflow/assets/images/favicon.png'),
    Path('/home/ubuntu/taskflow/assets/images/android-icon-foreground.png'),
]
image = Image.open(source).convert('RGBA')
image.thumbnail((512, 512), Image.Resampling.LANCZOS)
for output in outputs:
    image.save(output, format='PNG', optimize=True)
