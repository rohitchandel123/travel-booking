import './TourSlider.css';
import { useState, useEffect, useMemo, useCallback } from 'react';
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
  const [cardsPerSlide, setCardsPerSlide] = useState(4);

  const attractions = data?.data?.products?.slice(1, 9) || [];
  const totalSlides = attractions.length - cardsPerSlide + 1;
  const [currentIndex, setCurrentIndex] = useState(0);
  const ethPrice = 1765;
  const skeletonKeys = ['skeleton-1', 'skeleton-2', 'skeleton-3', 'skeleton-4'];

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width <= 480) {
        setCardsPerSlide(1);
      } else if (width <= 768) {
        setCardsPerSlide(2);
      } else if (width <= 992) {
        setCardsPerSlide(3);
      } else {
        setCardsPerSlide(4);
      }
    };

    handleResize(); // Initial call
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset current index when cards per slide changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [cardsPerSlide]);

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

  const handleSwipeLeft = useCallback(() => {
    setCurrentIndex((prev) =>
      prev + 1 < attractions.length ? prev + 1 : 0
    );
  }, [attractions.length]);

  const handleSwipeRight = useCallback(() => {
    setCurrentIndex((prev) =>
      prev - 1 >= 0 ? prev - 1 : attractions.length - cardsPerSlide
    );
  }, [attractions.length, cardsPerSlide]);

  const dotKeys = useMemo(
    () => Array.from({ length: totalSlides }, (_) => crypto.randomUUID()),
    [totalSlides]
  );

  const handlers = useSwipeable({
    onSwipedLeft: handleSwipeLeft,
    onSwipedRight: handleSwipeRight,
    trackMouse: true,
    delta: 10,
    swipeDuration: 500,
  });

  const handleDotClick = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const getVisibleCards = useCallback(() => {
    let visible = attractions.slice(currentIndex, currentIndex + cardsPerSlide);
    if (visible.length < cardsPerSlide) {
      const remaining = cardsPerSlide - visible.length;
      visible = [...visible, ...attractions.slice(0, remaining)];
    }
    return visible;
  }, [attractions, currentIndex, cardsPerSlide]);

  const handleFavoriteChange = useCallback((slugValue: string, isFavorite: boolean) => {
    if (isFavorite) {
      setFavorites(prev => [...prev, slugValue]);
    } else {
      setFavorites(prev => prev.filter(slug => slug !== slugValue));
    }
  }, []);

  return (
    <div className="tour-slider-container" {...handlers}>
      <div className="tour-slider-content">
        {isLoading || isLoadingFavorites ? (
          Array.from({ length: cardsPerSlide }).map((_, i) => (
            <TourCardSkeleton key={skeletonKeys[i % skeletonKeys.length]} />
          ))
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

      {!isLoading && !isLoadingFavorites && totalSlides > 1 && (
        <div className="navigation-dots">
          {dotKeys.map((key, index) => (
            <button
              key={key}
              className={`slider-btn dot ${currentIndex === index ? 'active' : ''}`}
              onClick={() => handleDotClick(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default TourSlider;