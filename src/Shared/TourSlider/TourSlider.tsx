import './TourSlider.css';
import { useState, useEffect, useMemo } from 'react';
import { useSwipeable } from 'react-swipeable';
import { useGetTrendingAttractionQuery } from '../../Services/Api/module/demoApi';
import TourCard from '../TourCard/index';
import TourCardSkeleton from '../TourCardSkeleton/TourCardSkeleton';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

function TourSlider() {
  const destinationId = "eyJwaW5uZWRQcm9kdWN0IjoiUFJpSEhIVjB1TGJPIiwidWZpIjoyMDA4ODMyNX0=";
  const currentPage = 1;
  const { data, isLoading } = useGetTrendingAttractionQuery({ destinationId, currentPage });
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);

  const attractions = data?.data?.products?.slice(1, 9) || [];
  const cardsPerSlide = 4;
  const totalSlides = attractions.length - cardsPerSlide + 1;
  const [currentIndex, setCurrentIndex] = useState(0);
  const ethPrice = 1765;
  const skeletonKeys = ['skeleton-1', 'skeleton-2', 'skeleton-3', 'skeleton-4'];
  
  useEffect(() => {
    const fetchFavorites = async () => {
      const user = auth.currentUser;
      if (!user) {
        setIsLoadingFavorites(false);
        return;
      }

      try {
        setIsLoadingFavorites(true);
        const q = query(collection(db, 'favorites'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        const favoriteSlugs: string[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.tourSlug) {
            favoriteSlugs.push(data.tourSlug);
          }
        });
        
        setFavorites(favoriteSlugs);
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        setIsLoadingFavorites(false);
      }
    };

    fetchFavorites();

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchFavorites();
      } else {
        setFavorites([]);
        setIsLoadingFavorites(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSwipeLeft = () => {
    setCurrentIndex((prev) =>
      prev + 1 < attractions.length ? prev + 1 : 0
    );
  };

  const handleSwipeRight = () => {
    setCurrentIndex((prev) =>
      prev - 1 >= 0 ? prev - 1 : attractions.length - cardsPerSlide
    );
  };

  const dotKeys = useMemo(
    () => Array.from({ length: totalSlides }, (_) => crypto.randomUUID()),
    [totalSlides]
  );

  const handlers = useSwipeable({
    onSwipedLeft: handleSwipeLeft,
    onSwipedRight: handleSwipeRight,
    trackMouse: true,
  });

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  const getVisibleCards = () => {
    let visible = attractions.slice(currentIndex, currentIndex + cardsPerSlide);
    if (visible.length < cardsPerSlide) {
      const remaining = cardsPerSlide - visible.length;
      visible = [...visible, ...attractions.slice(0, remaining)];
    }
    return visible;
  };

  const handleFavoriteChange = (slugValue: string, isFavorite: boolean) => {
    if (isFavorite) {
      setFavorites(prev => [...prev, slugValue]);
    } else {
      setFavorites(prev => prev.filter(slug => slug !== slugValue));
    }
  };

  return (
    <div className="tour-slider-container" {...handlers}>
      <div className="tour-slider-content">
        {isLoading || isLoadingFavorites ? (
          Array.from({ length: 4 }).map((_, i) => <TourCardSkeleton key={skeletonKeys[i]} />)
        ) : (
          getVisibleCards().map((item: any, i: number) => {
            const countryName = item?.ufiDetails?.url?.country?.toUpperCase();
            const cityName = item?.ufiDetails?.bCityName;
            const tourName = item?.name;
            const tourImage = item?.primaryPhoto?.small;
            const tourRating = item?.reviewsStats?.combinedNumericStats?.average;
            const tourReview = item?.reviewsStats?.combinedNumericStats.total;

            const usdPrice = item?.representativePrice?.chargeAmount;
            const tourPrice = ethPrice ? `${(usdPrice / ethPrice).toFixed(5)} ETH` : "Loading...";
            const slugValue = item?.slug;
            const isFavorite = favorites.includes(slugValue);

            return (
              <TourCard
                key={`${slugValue}-${i}`}
                cityName={cityName}
                countryName={countryName}
                tourName={tourName}
                tourImage={tourImage}
                tourRating={tourRating}
                tourReview={tourReview}
                tourPrice={tourPrice}
                tourDuration="1 day"
                slugValue={slugValue}
                isFavorite={isFavorite}
                onFavoriteChange={handleFavoriteChange}
              />
            );
          })
        )}
      </div>

      <div className="navigation-dots">
        {dotKeys.map((key, index) => (
          <button
            key={key}
            className={`slider-btn dot ${currentIndex === index ? 'active' : ''}`}
            onClick={() => handleDotClick(index)}
          />
        ))}
      </div>
    </div>
  );
}

export default TourSlider;