import './WhyUsComponent.css';
import ForHomePage from './ForHomePage/index';
import { ProjectImages } from '../../assets/ProjectImages';

function WhyUsComponent() {
  return (
    <div className="whyUs-section">
      <div className="main-div-container">
        <div className="whyUs-image-div">
          <div className="image-container">
            <img className="second-image" src={ProjectImages.WHY_US_IMGTWO} alt='why us one' />{' '}
            <img className="first-image" src={ProjectImages.WHY_US_IMGONE} alt='why us two' />
          </div>
        </div>

        <div className="whyUs-content-div"> 
          <ForHomePage />
        </div>
      </div>
    </div>
  );
}
export default WhyUsComponent;
