import { ProjectImages } from "../../assets/ProjectImages";
import HomepageDestination from "./Shared/HomepageDestination/HomepageDestination";
import WhyUsComponent from "../../Shared/WhyUsComponent";
import SearchArea from "../../Shared/SearchArea";
import Testimonial from "../../Shared/Testimonial";
import "./HomePage.css";
import TourSlider from "../../Shared/TourSlider";
import { useEffect } from "react";
import TourCategoryCard from "./Shared/TourCategoryCard/TourCategoryCard";
import  {blogs}  from "../BlogPage/Blogs";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const numberData = [
    {quantity: 120, quantityElement:"Total Destination"},
    {quantity: 500, quantityElement:"Travel Packages"},
    {quantity: "10K", quantityElement:"Total Travelers"},
    {quantity: "7K", quantityElement:"Positive Reviews"},
  ]
  const TourCategoryData = [
    { categoryIcon: ProjectImages.ADVENTURE, tourType: "Adventure", numberOfTours: 10, startingPrice: 250, },
    {
      categoryIcon: ProjectImages.HIKING_TOURS,
      tourType: "Beaches",
      numberOfTours: 15,
      startingPrice: 200,
    },
    {
      categoryIcon: ProjectImages.FOOD_TOURS,
      tourType: "Boat Tours",
      numberOfTours: 10,
      startingPrice: 250,
    },
    {
      categoryIcon: ProjectImages.BOAT_TOURS,
      tourType: "City Tours",
      numberOfTours: 20,
      startingPrice: 200,
    },
    {
      categoryIcon: ProjectImages.BEACHES,
      tourType: "Food",
      numberOfTours: 25,
      startingPrice: 350,
    },
    {
      categoryIcon: ProjectImages.CITY_TOURS,
      tourType: "Hiking",
      numberOfTours: 20,
      startingPrice: 300,
    },
  ];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div>
      <div className="homepage-banner">
        <img src={ProjectImages.HomePageBanner} alt="home-page-banner" />
        <div className="banner-text-container">
          <div className="banner-text-content">
            <h3 className="kaushan-text">Save 15% off in Worldwide</h3>
            <h1 className="">Travel & Adventures</h1>
            <p className="project-normal-font">
              Find awesome tours and activities
            </p>
          </div>
        </div>
      </div>

      <SearchArea />

      <div className="tour-container">
        <div className="section-headers">
          <h4 className="kaushan-text cursive-normal">Tours</h4>
          <h2 className="section-heading">Most Popular Tours</h2>
        </div>
        <div className="tour-content-container">
          <div className="tour-content">
            <TourSlider />
          </div>
        </div>
      </div>

      <div className="homepage-number-wrapper">
      <div className="homepage-number-container">
      <div className="our-numbers-wrapper">
        <div className="our-numbers-container">
          {numberData.map((item)=>
            <div className="number-data" key={item.quantity}>
            <h1>{item.quantity}+</h1>
            <p>{item.quantityElement}</p>
                        </div>                        
          )}
        </div>
      </div>
      </div>
      </div>

      <HomepageDestination />

      <WhyUsComponent />

      <div className="browse-by-category-wrapper">
        <h4 className="cursive-text">Browse By Category</h4>
        <h2>Pick a Tour Type</h2>
        <div className="browse-by-category">
          {TourCategoryData.map((value) => (
            <TourCategoryCard
            key={value.categoryIcon}
              categoryIcon={value.categoryIcon}
              tourType={value.tourType}
              numberOfTours={value.numberOfTours}
              startingPrice={value.startingPrice}
            />
          ))}
        </div>
      </div>

      <div className="testimonial-section">
        <Testimonial />
      </div>


<div className="travel-guide-wrapper">
  <div className="travel-guide-container">
    <h4 className="cursive-text">Updates</h4>
    <h2>Latest Travel Guide</h2>
    <div className="travel-guide">
      {blogs.slice(0, 4).map((blog) => (
              <Link to={`/blog/${blog.id}`} className='link-class' key={blog.id}>
        <div className="travel-guide-card" key={blog.id}>
          <div className="travel-guide-image-container">
            <img src={blog.image} alt={blog.title} />
          </div>
          <div className="travel-guide-info">
            <p>{blog.date} Admin</p>
            <h6>{blog.title}</h6>
          </div>
        </div>
        </Link>
      ))}
    </div>
  </div>
</div>
    </div>
  );
}

