import "./TourPackage.css";
import { useState, useEffect } from "react";
import { CLASSNAMES } from "./Shared/Constants";
import PageBanner from "../../Shared/PageBanner";
import SearchArea from "../../Shared/SearchArea";
import FilterByDestination from "./Filter/FilterByDestination";
import FilterByReviews from "./Filter/FilterByReviews/index";
import FilterByPrice from "./Filter/FilterByPrice/index";
import TourCardSkeleton from "../../Shared/TourCardSkeleton/TourCardSkeleton";
import TourCard from "../../Shared/TourCard/index";
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from "../../firebaseConfig";

import {
  useGetTrendingToursQuery,
  useGetFilteredDestinationToursQuery,
  useGetAttractionQuery,
  useGetSearchedToursQuery,
} from "../../Services/Api/module/demoApi";
import { useSearchParams } from "react-router-dom";
import { ProjectImages } from "../../assets/ProjectImages";

interface AttractionType {
  id: string;
  name: string;
  slug: string;
  destinationId: string;
  ufiDetails: {
    url: {
      country: string;
    };
    bCityName: string;
  };
  primaryPhoto: {
    small: string;
  };
  reviewsStats: {
    combinedNumericStats: {
      total: number;
      average: number;
    };
    allReviewsCount: number;
  };
  representativePrice: {
    chargeAmount: number;
  };
}

const TOURS_PER_PAGE = 21;
const PAGINATION_DISPLAY_LIMIT = 10;
const SIBLING_COUNT = 2;
const ETH_PRICE = 1765;

const generatePageNumbers = (
  currentPage: number,
  totalPages: number
): (number | string)[] => {
  if (totalPages <= PAGINATION_DISPLAY_LIMIT) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | string)[] = [];
  pages.push(1);
  const leftSiblingIndex = Math.max(currentPage - SIBLING_COUNT, 2);
  const rightSiblingIndex = Math.min(
    currentPage + SIBLING_COUNT,
    totalPages - 1
  );
  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < totalPages - 1;
  if (shouldShowLeftDots) {
    pages.push("...");
  }
  for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
    pages.push(i);
  }
  if (shouldShowRightDots) {
    pages.push("...");
  }
  pages.push(totalPages);
  return pages;
};

const calculatePriceRange = (attractions: AttractionType[]): [number, number] => {
  if (!attractions || attractions.length === 0) {
    return [0.0001, 1];
  }

  const ethPrices = attractions
    .map(item => {
      const usdPrice = item?.representativePrice?.chargeAmount;
      if (typeof usdPrice === "number" && ETH_PRICE > 0) {
        return usdPrice / ETH_PRICE;
      }
      return null;
    })
    .filter((price): price is number => price !== null);

  if (ethPrices.length === 0) {
    return [0.0001, 1];
  }

  const minPrice = Math.min(...ethPrices);
  const maxPrice = Math.max(...ethPrices);

  const padding = (maxPrice - minPrice) * 0.1;
  const paddedMin = Math.max(0.0001, minPrice - padding);
  const paddedMax = maxPrice + padding;

  return [
    Math.round(paddedMin * 100000) / 100000,
    Math.round(paddedMax * 100000) / 100000
  ];
};

function TourPackagePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const destination = searchParams.get("destination") || "";
  const activity = searchParams.get("activity") || "";
  const startDate = searchParams.get("startDate") || null;
  const endDate = searchParams.get("endDate") || null;
  const guests = searchParams.get("guests") || "";
  const sortBy = searchParams.get("sort") || "trending";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const sidebarSearch = searchParams.get("sidebarSearch") || "";
  const sidebarDestination = searchParams.get("sidebarDestination") || "";

  const [sidebarSearchInput, setSidebarSearchInput] = useState(sidebarSearch);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);

  useEffect(() => {
    setSidebarSearchInput(sidebarSearch);
  }, [sidebarSearch]);

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

  const [selectedRating, setSelectedRating] = useState<number[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<number[]>([]);
  const [searchFormKey, setSearchFormKey] = useState<number>(0);

  const currentSearchValues = {
    destinationName: destination,
    activity: activity,
    selectDate: [startDate ? new Date(startDate) : null, endDate ? new Date(endDate) : null] as [Date | null, Date | null],
    "guest-numbers": guests,
  };

  const activeDestination = destination || sidebarDestination || sidebarSearch || "";

  const {
    data: filteredDestination,
    isLoading: isLoadingDestination,
    isFetching: isFetchingDestination,
    isSuccess: isSuccessDestination,
    isError: isErrorDestination,
  } = useGetFilteredDestinationToursQuery(activeDestination, {
    skip: !activeDestination,
  });

  const destinationId = filteredDestination?.data?.products?.[0]?.id;
  const isDateFilterActive = !!endDate;

  const {
    data: searchedTours,
    isLoading: isLoadingSearched,
    isFetching: isFetchingSearched,
    isSuccess: isSuccessSearched,
    isError: isErrorSearched,
  } = useGetSearchedToursQuery(
    { destinationId, selectedDate: [startDate, endDate], currentPage, sortBy, limit: TOURS_PER_PAGE },
    { skip: !destinationId || !isSuccessDestination || !isDateFilterActive }
  );

  const {
    data: attractionData,
    isLoading: isLoadingAttraction,
    isFetching: isFetchingAttraction,
    isSuccess: isSuccessAttraction,
    isError: isErrorAttraction,
  } = useGetAttractionQuery(
    { destinationId, currentPage, sortBy, limit: TOURS_PER_PAGE },
    { skip: !destinationId || !isSuccessDestination || isDateFilterActive }
  );

  const {
    data: trendingDestination,
    isLoading: isLoadingTrending,
    isFetching: isFetchingTrending,
    isSuccess: isSuccessTrending,
  } = useGetTrendingToursQuery(
    { currentPage, sortBy, limit: TOURS_PER_PAGE },
    { skip: !!activeDestination || isDateFilterActive }
  );

  const [mergedAttractions, setMergedAttractions] = useState<AttractionType[]>([]);
  const [totalTours, setTotalTours] = useState<number>(0);
  const [initialLoadComplete, setInitialLoadComplete] = useState<boolean>(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0.0001, 1]);

  useEffect(() => {
    let activeData = null;
    let activeSuccess = false;
    let activeFetching = true;

    if (activeDestination && destinationId && isDateFilterActive) {
      activeData = searchedTours;
      activeSuccess = isSuccessSearched;
      activeFetching = isFetchingSearched || isFetchingDestination;
    } else if (activeDestination && destinationId && !isDateFilterActive) {
      activeData = attractionData;
      activeSuccess = isSuccessAttraction;
      activeFetching = isFetchingAttraction || isFetchingDestination;
    } else if (!activeDestination && !isDateFilterActive) {
      activeData = trendingDestination;
      activeSuccess = isSuccessTrending;
      activeFetching = isFetchingTrending;
    } else {
      activeFetching = isFetchingDestination || isFetchingSearched || isFetchingAttraction || isFetchingTrending;
    }

    if (!activeFetching) {
      setInitialLoadComplete(true);
    }

    if (activeSuccess && activeData?.data?.products) {
      const attractions = activeData.data.products;
      setMergedAttractions(attractions);
      setTotalTours(activeData.data.filterStats?.filteredProductCount || 0);
      
      const newPriceRange = calculatePriceRange(attractions);
      setPriceRange(newPriceRange);
      
      setSelectedPrice([]);
    } else if (initialLoadComplete && !activeFetching) {
      setMergedAttractions([]);
      setTotalTours(0);
      setPriceRange([0.0001, 1]);
      setSelectedPrice([]);
    }
  }, [
    activeDestination,
    destinationId,
    isDateFilterActive,
    searchedTours,
    isSuccessSearched,
    isFetchingSearched,
    attractionData,
    isSuccessAttraction,
    isFetchingAttraction,
    trendingDestination,
    isSuccessTrending,
    isFetchingTrending,
    isSuccessDestination,
    isFetchingDestination,
    initialLoadComplete,
  ]);

  const handleFavoriteChange = (slugValue: string, isFavorite: boolean) => {
    if (isFavorite) {
      setFavorites(prev => [...prev, slugValue]);
    } else {
      setFavorites(prev => prev.filter(slug => slug !== slugValue));
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalTours / TOURS_PER_PAGE));
  const pageNumbersToDisplay = generatePageNumbers(currentPage, totalPages);

  const displayedAttractions = [...mergedAttractions].filter(item => {
    let passesRatingFilter = true;
    let passesPriceFilter = true;

    if (selectedRating.length > 0) {
      const averageRating = item?.reviewsStats?.combinedNumericStats?.average;
      if (typeof averageRating === "number") {
        passesRatingFilter = selectedRating.some(selected => {
          if (selected === 5) return averageRating === 5;
          return averageRating >= selected && averageRating < selected + 1;
        });
      } else {
        passesRatingFilter = false;
      }
    }

    if (selectedPrice?.length === 2) {
      const [minPrice, maxPrice] = selectedPrice;
      const usdPrice = item?.representativePrice?.chargeAmount;
      if (typeof usdPrice === "number" && ETH_PRICE > 0) {
        const itemEthPrice = usdPrice / ETH_PRICE;
        passesPriceFilter = itemEthPrice >= minPrice && itemEthPrice <= maxPrice;
      } else {
        passesPriceFilter = false;
      }
    }

    return passesRatingFilter && passesPriceFilter;
  });

  const shimmerCardId = Array.from({ length: 21 }, (_, i) => i + 1);

  function handleSortChange(value: string) {
    searchParams.set("sort", value);
    searchParams.set("page", "1");
    setSearchParams(searchParams);
  }

  function handlePageChange(value: number) {
    const newPage = currentPage + value;
    if (newPage >= 1) {
      searchParams.set("page", newPage.toString());
      setSearchParams(searchParams);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function goToPage(pageNumber: number) {
    if (pageNumber >= 1 && pageNumber !== currentPage) {
      searchParams.set("page", pageNumber.toString());
      setSearchParams(searchParams);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleSidebarSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSidebarSearchInput(e.target.value);
  }

  function handleSidebarSearchSubmit() {
    searchParams.delete("destination");
    searchParams.delete("activity");
    searchParams.delete("startDate");
    searchParams.delete("endDate");
    searchParams.delete("guests");
    searchParams.delete("sidebarDestination");
    searchParams.delete("priceMin");
    searchParams.delete("priceMax");
    searchParams.delete("review");
    searchParams.set("sidebarSearch", sidebarSearchInput);
    searchParams.set("page", "1");
    setSearchParams(searchParams);
  }

  function handleDestinationData(data: string | null) {
    searchParams.delete("destination");
    searchParams.delete("activity");
    searchParams.delete("startDate");
    searchParams.delete("endDate");
    searchParams.delete("guests");
    searchParams.delete("sidebarSearch");
    if (data) {
      searchParams.set("sidebarDestination", data);
      searchParams.set("page", "1");
    } else {
      searchParams.delete("sidebarDestination");
      searchParams.set("page", "1");
    }
    setInitialLoadComplete(false);
    setSearchFormKey(prev => prev + 1);
    setSearchParams(searchParams);
  }

  function handleRatingData(value: number[]) {
    setSelectedRating(value);
  }

  function handleSelectedPrice(value: number[]) {
    setSelectedPrice(value);
  }

  const isOverallLoading =
    (isLoadingDestination || isFetchingDestination) ||
    (isLoadingSearched || isFetchingSearched) ||
    (isLoadingAttraction || isFetchingAttraction) ||
    (isLoadingTrending || isFetchingTrending) ||
    !initialLoadComplete ||
    isLoadingFavorites;

  const hasError =
    initialLoadComplete &&
    ((destination && !destinationId && isErrorDestination) ||
      (destinationId && isDateFilterActive && isErrorSearched) ||
      (destinationId && !isDateFilterActive && isErrorAttraction))

  const failedToFindDestinationId =
    initialLoadComplete &&
    destination &&
    isSuccessDestination &&
    !destinationId;

  const showShimmer = isOverallLoading;
  const showError = !isOverallLoading && hasError;
  const showNoResults =
    !isOverallLoading &&
    !hasError &&
    (failedToFindDestinationId || displayedAttractions.length === 0);
  const showResults =
    initialLoadComplete &&
    !isOverallLoading &&
    !hasError &&
    !showNoResults &&
    displayedAttractions.length > 0;
  const showPagination =
    !isOverallLoading &&
    !hasError &&
    totalPages > 1 &&
    displayedAttractions.length > 0;

  let content;
  if (showShimmer) {
    content = shimmerCardId.map(item => <TourCardSkeleton key={item} />);
  } else if (showError) {
    content = (
      <div className="error-message" style={{ textAlign: "center", padding: "40px", gridColumn: "1 / -1" }}>
        <p>Sorry, an error occurred while fetching tours. Please try again later.</p>
      </div>
    );
  } else if (showResults) {
    content = displayedAttractions.map((item: AttractionType) => {
      const countryName = item?.ufiDetails?.url?.country?.toUpperCase() || "N/A";
      const cityName = item?.ufiDetails?.bCityName || "N/A";
      const tourName = item?.name || "Unnamed Tour";
      const tourImage = item?.primaryPhoto?.small;
      const tourRating = item?.reviewsStats?.combinedNumericStats?.average?.toFixed(1);
      const tourReview = item?.reviewsStats?.combinedNumericStats?.total.toString() || "0";
      const usdPrice = item?.representativePrice?.chargeAmount;
      const tourPrice = ETH_PRICE > 0 && typeof usdPrice === "number"
        ? `${(usdPrice / ETH_PRICE).toFixed(5)} ETH`
        : "N/A";
      const slugValue = item?.slug || item.id?.toString();
      const uniqueKey = `${item.destinationId || "dest"}-${item.id || slugValue}-${currentPage}`;
      const isFavorite = favorites.includes(slugValue);

      return (
        <TourCard
          key={uniqueKey}
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
    });
  } else if (showNoResults) {
    content = (
      <div className="no-tours-found" style={{ textAlign: "center", padding: "40px", gridColumn: "1 / -1" }}>
        <div className="not-foung-image">
          <img src={ProjectImages.NOT_FOUND} alt="Not Found" />
        </div>
        <p>Sorry, No Tours Found Matching Your Criteria.</p>
        {failedToFindDestinationId && <p>We couldn't find tours for the specified destination.</p>}
        {mergedAttractions.length > 0 && (selectedRating.length > 0 || selectedPrice.length > 0) && (
          <p>Try adjusting your filters.</p>
        )}
        {!failedToFindDestinationId && mergedAttractions.length === 0 && totalTours === 0 && (
          <p>No tours available for this destination.</p>
        )}
      </div>
    );
  }

  return (
    <>
      <PageBanner
        headingText="Tours"
        normalText="Home /"
        coloredText="Tours"
        bannerImage={ProjectImages.TOURPAGE_BANNER}
      />
      <SearchArea
        initialSearchValues={currentSearchValues}
        isSearchArea={true}
        onFocusResetSidebarFilters={() => {
          setSelectedRating([]);
          setSelectedPrice([]);
        }}
        formKey={searchFormKey}
      />

      <div className={CLASSNAMES.FILTER_DISPLAY}>
        <div className={CLASSNAMES.FILTER_CONTAINER}>
          <div className="tour-filter-types">
            <div className="search-destination-wrapper">
              <h3>Search Destination</h3>
              <div className="search-input-with-icon">
                <input
                  type="text"
                  value={sidebarSearchInput}
                  onChange={handleSidebarSearchChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSidebarSearchSubmit();
                  }}
                  placeholder="Search Destination..."
                />
                <button
                  onClick={handleSidebarSearchSubmit}
                  className="side-bar-search-button"
                  aria-label="Search"
                >
                  <i className="fa fa-search search-icon search-icon-filter" />
                </button>
              </div>
            </div>
          </div>

          {(showPagination || displayedAttractions.length > 0 || selectedPrice.length > 0) && (
            <div className="tour-filter-types">
              <FilterByPrice
                handleSelectedPrice={handleSelectedPrice}
                currentPriceRange={selectedPrice}
                minPrice={priceRange[0]}
                maxPrice={priceRange[1]}
              />
            </div>
          )}

          <div className="tour-filter-types">
            <FilterByDestination
              handleDestinationData={handleDestinationData}
              currentDestination={sidebarDestination}
            />
          </div>

          {(showPagination || displayedAttractions.length > 0 || selectedRating.length > 0) && (
            <div className="tour-filter-types">
              <FilterByReviews
                handleRatingData={handleRatingData}
                currentRatings={selectedRating}
              />
            </div>
          )}
        </div>

        <div className={CLASSNAMES.TOURS_WRAPPER}>
          {(showPagination || displayedAttractions.length > 0) && (
            <div className="sorting-container">
              <label htmlFor="tour-sort">Sort by: </label>
              <select
                id="tour-sort"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="sort-select"
              >
                <option value="trending">Trending</option>
                <option value="attr_book_score">Most popular</option>
                <option value="lowest_price">Lowest Price</option>
              </select>
            </div>
          )}

          <div className={CLASSNAMES.TOURS_CONTAINER}>{content}</div>
        </div>
      </div>

      {showPagination && (
        <div className="page-navigation-container">
          <div className="pages-navigation">
            <button
              className={`page-number-container ${currentPage === 1 ? "disabled" : ""}`}
              onClick={() => handlePageChange(-1)}
              style={{ cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
              disabled={currentPage === 1}
              aria-label="Previous Page"
            >
              <i className="fa-solid fa-chevron-left" />
            </button>

            {pageNumbersToDisplay.map((page) => {
              if (typeof page === "string") {
                return (
                  <span
                    key={page}
                    className="page-number-container ellipsis"
                    aria-hidden="true"
                  >
                    {page}
                  </span>
                );
              }
              return (
                <button
                  key={`page-${page}`}
                  className={`page-number-container ${currentPage === page ? "colored-page-number" : ""}`}
                  onClick={() => goToPage(page)}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && currentPage !== page) {
                      e.preventDefault();
                      goToPage(page);
                    }
                  }}
                  style={{ cursor: currentPage === page ? "default" : "pointer" }}
                  aria-current={currentPage === page ? "page" : undefined}
                  aria-label={`Go to page ${page}`}
                >
                  {page}
                </button>
              );
            })}

            <button
              className={`page-number-container ${currentPage === totalPages ? "disabled" : ""}`}
              onClick={() => currentPage !== totalPages && handlePageChange(1)}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && currentPage !== totalPages) {
                  handlePageChange(1);
                }
              }}
              style={{ cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
              disabled={currentPage === totalPages}
              aria-label="Next Page"
            >
              <i className="fa-solid fa-chevron-right" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default TourPackagePage;