import { useEffect, useState } from 'react';

/**
 * AuthImage component - Fetches images with authentication headers
 * to avoid 401 errors when displaying protected images
 */
function AuthImage({ src, alt, className, style, fallback }) {
    const [imageSrc, setImageSrc] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!src) {
            setError(true);
            return;
        }

        let isMounted = true;
        const fetchImage = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    if (isMounted) setError(true);
                    return;
                }

                const headers = {
                    'Authorization': `${token.split(' ')[0]} ${token.split(' ')[1]}`
                };

                // Handle both relative and absolute URLs
                // Ensure src starts with / if it's a relative path
                let imageUrl;
                if (src.startsWith('http://') || src.startsWith('https://')) {
                    imageUrl = src;
                } else if (src.startsWith('/')) {
                    imageUrl = `http://localhost:4040${src}`;
                } else {
                    imageUrl = `http://localhost:4040/${src}`;
                }

                const response = await fetch(imageUrl, { headers });
                
                if (response.ok) {
                    const blob = await response.blob();
                    if (isMounted) {
                        const objectUrl = URL.createObjectURL(blob);
                        setImageSrc(objectUrl);
                        setError(false);
                    }
                } else {
                    console.warn(`Failed to fetch image (${response.status}): ${imageUrl}`);
                    if (isMounted) setError(true);
                }
            } catch (err) {
                console.error('Error fetching authenticated image:', err);
                if (isMounted) setError(true);
            }
        };

        fetchImage();

        // Cleanup function
        return () => {
            isMounted = false;
            if (imageSrc && imageSrc.startsWith('blob:')) {
                URL.revokeObjectURL(imageSrc);
            }
        };
    }, [src]);

    if (error || !imageSrc) {
        return fallback || null;
    }

    return (
        <img
            src={imageSrc}
            alt={alt}
            className={className}
            style={style}
        />
    );
}

export default AuthImage;