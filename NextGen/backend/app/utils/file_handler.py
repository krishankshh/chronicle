"""File upload and handling utilities."""
import os
import uuid
from werkzeug.utils import secure_filename
from PIL import Image
import io


class FileHandler:
    """Handle file uploads and storage."""

    ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    ALLOWED_DOCUMENT_EXTENSIONS = {'pdf', 'doc', 'docx', 'rtf'}
    ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'mov', 'mkv', 'avi', 'webm'}
    MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
    MAX_DOCUMENT_SIZE = 10 * 1024 * 1024  # 10MB
    AVATAR_SIZE = (300, 300)  # Avatar dimensions

    @staticmethod
    def allowed_file(filename, file_type='image'):
        """Check if file extension is allowed."""
        if '.' not in filename:
            return False

        ext = filename.rsplit('.', 1)[1].lower()

        if file_type == 'image':
            return ext in FileHandler.ALLOWED_IMAGE_EXTENSIONS
        if file_type == 'document':
            return ext in FileHandler.ALLOWED_DOCUMENT_EXTENSIONS
        if file_type == 'video':
            return ext in FileHandler.ALLOWED_VIDEO_EXTENSIONS
        return ext in (
            FileHandler.ALLOWED_IMAGE_EXTENSIONS
            | FileHandler.ALLOWED_DOCUMENT_EXTENSIONS
            | FileHandler.ALLOWED_VIDEO_EXTENSIONS
        )

    @staticmethod
    def generate_filename(original_filename):
        """Generate a unique filename."""
        ext = original_filename.rsplit('.', 1)[1].lower() if '.' in original_filename else 'jpg'
        unique_id = str(uuid.uuid4())
        return f"{unique_id}.{ext}"

    @staticmethod
    def save_local_file(file, upload_folder, filename=None):
        """Save file to local storage."""
        if not filename:
            filename = FileHandler.generate_filename(file.filename)

        # Create upload folder if it doesn't exist
        os.makedirs(upload_folder, exist_ok=True)

        filepath = os.path.join(upload_folder, filename)
        file.save(filepath)

        return filename

    @staticmethod
    def save_image(file, upload_folder, filename=None, max_size=(1200, 1200), quality=85):
        """Save and optimize an image file."""
        if not filename:
            filename = FileHandler.generate_filename(file.filename)

        # Read file data
        file.stream.seek(0)
        image_data = file.read()

        optimized_data = FileHandler.optimize_image(image_data, max_size=max_size, quality=quality)

        # Ensure upload folder exists
        os.makedirs(upload_folder, exist_ok=True)

        filepath = os.path.join(upload_folder, filename)
        with open(filepath, 'wb') as f:
            f.write(optimized_data)

        # Reset file pointer for potential further use
        file.stream.seek(0)

        return filename

    @staticmethod
    def optimize_image(image_data, max_size=(800, 800), quality=85):
        """Optimize image size and quality."""
        try:
            img = Image.open(io.BytesIO(image_data))

            # Convert RGBA to RGB if necessary
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background

            # Resize if larger than max_size
            img.thumbnail(max_size, Image.Resampling.LANCZOS)

            # Save to bytes
            output = io.BytesIO()
            img.save(output, format='JPEG', quality=quality, optimize=True)
            output.seek(0)

            return output.getvalue()
        except Exception as e:
            raise ValueError(f"Failed to optimize image: {str(e)}")

    @staticmethod
    def create_avatar(image_data):
        """Create avatar from uploaded image."""
        try:
            img = Image.open(io.BytesIO(image_data))

            # Convert to RGB
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background

            # Crop to square (center crop)
            width, height = img.size
            min_dim = min(width, height)
            left = (width - min_dim) // 2
            top = (height - min_dim) // 2
            right = left + min_dim
            bottom = top + min_dim
            img = img.crop((left, top, right, bottom))

            # Resize to avatar size
            img = img.resize(FileHandler.AVATAR_SIZE, Image.Resampling.LANCZOS)

            # Save to bytes
            output = io.BytesIO()
            img.save(output, format='JPEG', quality=90, optimize=True)
            output.seek(0)

            return output.getvalue()
        except Exception as e:
            raise ValueError(f"Failed to create avatar: {str(e)}")

    @staticmethod
    def save_avatar(file_data, upload_folder, filename=None):
        """Save and optimize avatar image."""
        try:
            # Create avatar
            avatar_data = FileHandler.create_avatar(file_data)

            # Generate filename if not provided
            if not filename:
                filename = f"avatar_{uuid.uuid4().hex}.jpg"

            # Ensure upload folder exists
            os.makedirs(upload_folder, exist_ok=True)

            # Save file
            filepath = os.path.join(upload_folder, filename)
            with open(filepath, 'wb') as f:
                f.write(avatar_data)

            return filename
        except Exception as e:
            raise ValueError(f"Failed to save avatar: {str(e)}")

    @staticmethod
    def delete_file(filepath):
        """Delete a file if it exists."""
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
                return True
            return False
        except Exception as e:
            print(f"Error deleting file {filepath}: {e}")
            return False

    @staticmethod
    def get_file_url(filename, base_url='http://localhost:5000/uploads'):
        """Get full URL for a file."""
        if not filename:
            return None
        return f"{base_url}/{filename}"
