import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import TourCard from '../../Shared/TourCard/index';
import './FavoritesPage.css';
import { onAuthStateChanged, User } from 'firebase/auth';

interface FavoriteTour {
  id: string;
  userId: string;
  tourSlug: string;
  tourName: string;
  cityName: string;
  countryName: string;
  tourImage?: string;
  tourRating?: string;
  tourReview?: string;
  tourPrice?: string;
  tourDuration?: string;
  timestamp?: Date;
}

function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteTour[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null); 
  const [authLoading, setAuthLoading] = useState<boolean>(true); 
  const [favoriteSlugs, setFavoriteSlugs] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false); 
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) {
        setFavorites([]);
        setFavoriteSlugs([]);
        setLoading(false);
        return;
        console.log(favoriteSlugs)
      }

      try {
        const q = query(
          collection(db, 'favorites'),
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const favoriteTours: FavoriteTour[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as FavoriteTour));
        
        const slugs = favoriteTours.map(tour => tour.tourSlug);
        setFavoriteSlugs(slugs);
        setFavorites(favoriteTours);
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchFavorites();
    }
  }, [user, authLoading]);

  const handleRemoveFavorite = (tourId: string) => {
    const tourToRemove = favorites.find(tour => tour.id === tourId);
    if (tourToRemove) {
      setFavorites(prevFavorites => prevFavorites.filter(tour => tour.id !== tourId));
      setFavoriteSlugs(prevSlugs => prevSlugs.filter(slug => slug !== tourToRemove.tourSlug));
    }
  };

  const handleFavoriteChange = (slugValue: string, isFavorite: boolean) => {
    if (!isFavorite) {
      setFavorites(prevFavorites => prevFavorites.filter(tour => tour.tourSlug !== slugValue));
      setFavoriteSlugs(prevSlugs => prevSlugs.filter(slug => slug !== slugValue));
    }
  };

  if (authLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in to view your favorite tours.</div>;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="favorites-page-container">
      <h2>Your Favorite Tours</h2>
      {favorites.length === 0 ? (
        <p className='favorite-page-minor-heading'>No favorite tours yet.</p>
      ) : (
        <div className="favorites-grid">
          {favorites.map((tour) => (
            <TourCard
              key={tour.id}
              cityName={tour.cityName}
              countryName={tour.countryName}
              tourName={tour.tourName}
              tourImage={tour.tourImage ?? ''}
              tourRating={tour.tourRating ?? '0'}
              tourReview={tour.tourReview ?? '0'}
              tourPrice={`${tour.tourPrice ?? '0'}`}
              tourDuration={tour.tourDuration ?? 'N/A'}
              slugValue={tour.tourSlug}
              isFavorite={true}
              onFavoriteChange={handleFavoriteChange}
              onRemoveFavorite={() => handleRemoveFavorite(tour.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default FavoritesPage;