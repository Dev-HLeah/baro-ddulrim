from PIL import Image

def crop_transparent_padding(image_path):
    try:
        img = Image.open(image_path).convert("RGBA")
        alpha = img.split()[-1]
        bbox = alpha.getbbox()
        if bbox:
            img_cropped = img.crop(bbox)
            img_cropped.save(image_path)
            print(f"Cropped {image_path} to {bbox}")
        else:
            print(f"Failed to find bbox for {image_path}")
    except Exception as e:
        print(f"Error processing {image_path}: {e}")

paths = [
    'apps/web/public/logo-icon.png',
    'apps/web/public/logo-text.png',
    'apps/web/public/character.png',
    'apps/web/src/app/icon.png',
    'apps/partner/public/logo-icon.png',
    'apps/partner/public/logo-text.png',
    'apps/partner/public/character.png',
    'apps/partner/src/app/icon.png'
]

for p in paths:
    crop_transparent_padding(p)
