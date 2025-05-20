import './TourCard.css';
import { Link } from 'react-router-dom';
import { ROUTES_CONFIG } from '../../Shared/Constants';
import { useState, useEffect } from 'react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';

interface TourCardProps {
  readonly cityName: string;
  readonly countryName: string;
  readonly tourName: string;
  readonly tourImage: string;
  readonly tourRating: string;
  readonly tourReview: string;
  readonly tourPrice: string;
  readonly tourDuration: string;
  readonly slugValue: string;
  readonly isFavorite?: boolean;
  readonly onFavoriteChange?: (slugValue: string, isFavorite: boolean) => void;
  readonly onRemoveFavorite?: () => void; 
}

function TourCard({
  cityName,
  countryName,
  tourName,
  tourImage,
  tourRating,
  tourReview,
  tourPrice,
  tourDuration,
  slugValue,
  isFavorite = false,
  onFavoriteChange,
  onRemoveFavorite,
}: TourCardProps) {
  const [isLocalFavorite, setIsLocalFavorite] = useState(isFavorite);
  const user = auth.currentUser;
  
  useEffect(() => {
    setIsLocalFavorite(isFavorite);
  }, [isFavorite]);

  const handleFavoriteToggle = async () => {
    if (!user) {
      toast('Please log in to save favorites');
      return;
    }

    const favoriteRef = doc(db, 'favorites', `${user.uid}_${slugValue}`);

    try {
      if (isLocalFavorite) {
        await deleteDoc(favoriteRef);
        setIsLocalFavorite(false);
        
        if (onFavoriteChange) {
          onFavoriteChange(slugValue, false);
        }
        
        if (onRemoveFavorite) {
          onRemoveFavorite(); 
        }
      } else {
        await setDoc(favoriteRef, {
          userId: user.uid,
          tourSlug: slugValue,
          tourName,
          cityName,
          countryName,
          tourImage,
          tourRating,
          tourReview,
          tourPrice,
          tourDuration,
          timestamp: new Date(),
        });
        
        setIsLocalFavorite(true);
        
        if (onFavoriteChange) {
          onFavoriteChange(slugValue, true);
        }
      }
    } catch (error) {
      console.error('Error updating favorite:', error);
      toast.error('Error updating favorite');
    }
  };

  return (
    <Link
      to={ROUTES_CONFIG.TOURS_DETAIL.path.replace(':slugId', slugValue)}
      className="link-class"
    >
      <div className="tour-card-container">
        <div className="tour-image-container">
          <img src={tourImage} alt={tourName} />
          <button
            className="favorite-button"
            onClick={(e) => {
              e.preventDefault();
              handleFavoriteToggle();
            }}
          >
            <FontAwesomeIcon
              icon={faHeart}
              className={isLocalFavorite ? 'heart-icon favorite' : 'heart-icon'}
            />
          </button>
        </div>
        <div className="tour-info-container">
          <p className="project-theme-color">
            {cityName}, {countryName}
          </p>
          <Link
            className="link-class"
            to={ROUTES_CONFIG.TOURS_DETAIL.path.replace(':slugId', slugValue)}
          >
            <h4>{tourName}</h4>
          </Link>

          <div className="tour-additional-info">
            <div className="rating-reviews">
              <span className="rating-star-class">
                <i className="fa fa-star" /> {tourRating}
              </span>
              <span className="tour-additional-info-text">
                {tourReview} reviews
              </span>
            </div>
            <span className="tour-additional-info-text">{tourDuration}</span>
          </div>

          <div className="tour-price">
            <p>Starting From</p>
            <span className="tour-price-text">{tourPrice}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default TourCard;