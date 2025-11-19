'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Heart } from 'lucide-react';
import { useLoginPopup } from '@/app/providers/LoginPopupProvider';
import {
  isFavorite as checkIsFavorite,
  addToFavorites,
  removeFromFavorites
} from '@/lib/favorites/localStorage';

type FavoriteButtonProps = {
  productId: string;
  className?: string;
  iconSize?: number;
  showLoginPopup?: boolean;
};

export default function FavoriteButton({
  productId,
  className = '',
  iconSize = 18,
  showLoginPopup = true,
}: FavoriteButtonProps) {
  const { data: session, status } = useSession();
  const { showLoginPopup: openLoginPopup } = useLoginPopup();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load favorite status from localStorage only
  useEffect(() => {
    loadFavoriteStatusFromLocalStorage();
  }, [productId]);

  // Listen for favorites changes from other components
  useEffect(() => {
    const handleFavoritesChanged = () => {
      loadFavoriteStatusFromLocalStorage();
    };

    window.addEventListener('losia:favorites-changed', handleFavoritesChanged);
    return () => {
      window.removeEventListener('losia:favorites-changed', handleFavoritesChanged);
    };
  }, [productId]);

  const loadFavoriteStatusFromLocalStorage = () => {
    try {
      setIsFavorite(checkIsFavorite(productId));
    } catch (error) {
      console.error('Error loading favorite status from localStorage:', error);
    }
  };

  const saveFavoriteToLocalStorage = (favorite: boolean) => {
    try {
      if (favorite) {
        addToFavorites(productId);
      } else {
        removeFromFavorites(productId);
      }
    } catch (error) {
      console.error('Error saving favorite to localStorage:', error);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if user is authenticated
    if (status !== 'authenticated' || !session?.user) {
      // Show login popup
      if (showLoginPopup) {
        openLoginPopup();
      }
      return;
    }

    setIsLoading(true);

    try {
      const newFavoriteStatus = !isFavorite;

      // Call API to save favorite
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const accessToken = (session.user as any)?.accessToken;

      if (accessToken) {
        try {
          const response = await fetch(`${apiUrl}/favorites/${productId}`, {
            method: newFavoriteStatus ? 'POST' : 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            console.warn('API favorite failed, falling back to localStorage only');
          }
        } catch (apiError) {
          console.warn('API favorite error, falling back to localStorage only:', apiError);
        }
      }

      // Always save to localStorage for immediate UI feedback and offline support
      saveFavoriteToLocalStorage(newFavoriteStatus);
      setIsFavorite(newFavoriteStatus);

      // Dispatch event for other components to update
      window.dispatchEvent(new CustomEvent('losia:favorites-changed', {
        detail: { productId, isFavorite: newFavoriteStatus }
      }));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label={isFavorite ? "Bỏ yêu thích" : "Yêu thích"}
        onClick={handleToggleFavorite}
        disabled={isLoading}
        className={`relative flex items-center justify-center rounded-full bg-white shadow-sm hover:bg-gray-50 disabled:opacity-50 ${className}`}
        title={
          status !== 'authenticated' 
            ? "Đăng nhập để yêu thích sản phẩm" 
            : isFavorite 
              ? "Bỏ yêu thích" 
              : "Yêu thích"
        }
      >
        {isFavorite ? (
          <Heart className="fill-red-500 text-red-500" size={iconSize} />
        ) : (
          <Heart className="text-gray-600" size={iconSize} />
        )}
      </button>
    </>
  );
}

