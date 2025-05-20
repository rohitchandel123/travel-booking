import "./FilterByPrice.css";
import { useState, useEffect } from "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import Button from "../../../../Components/Buttons/Button"; 

interface PriceFilterProps {
  readonly handleSelectedPrice: (value: number[]) => void;
  readonly currentPriceRange: number[];
  readonly minPrice?: number;
  readonly maxPrice?: number;
}

function FilterByPrice({ 
  handleSelectedPrice, 
  currentPriceRange, 
  minPrice = 0.0001, 
  maxPrice = 1 
}: PriceFilterProps) {
  const [range, setRange] = useState<[number, number]>([minPrice, maxPrice]);

  useEffect(() => {
    if (currentPriceRange.length === 0) {
      setRange([minPrice, maxPrice]);
    } else if (Array.isArray(currentPriceRange) && currentPriceRange.length === 2) {
      const parentRange = currentPriceRange as [number, number];
      if (range[0] !== parentRange[0] || range[1] !== parentRange[1]) {
        setRange(parentRange);
      }
    }
  }, [currentPriceRange, minPrice, maxPrice]);

  useEffect(() => {
    if (currentPriceRange.length === 0) {
      setRange([minPrice, maxPrice]);
    }
  }, [minPrice, maxPrice, currentPriceRange.length]);

  const handleSubmit = () => {
    handleSelectedPrice(range);
  };

  const handleSliderChange = (value: number | number[]) => {
    if (Array.isArray(value) && value.length === 2) {
      setRange(value as [number, number]);
    }
  };

  const calculateStep = (min: number, max: number): number => {
    const range = max - min;
    if (range <= 0.01) return 0.00001;
    if (range <= 0.1) return 0.0001;
    if (range <= 1) return 0.001;
    return 0.01;
  };

  const step = calculateStep(minPrice, maxPrice);

  return (
    <div className="filter-by-price-container">
      <h3>Filter By Price</h3>
      <div style={{ width: 250, margin: "2rem auto" }}>
        <Slider
          range
          min={minPrice}
          max={maxPrice}
          step={step}
          value={range}
          onChange={handleSliderChange}
          allowCross={false}
        />
        <div className="slider-selected-price">
          <span>{range[0].toFixed(5)} ETH</span>
          <span>{range[1].toFixed(5)} ETH</span>
        </div>
        <div className="slider-range-info" style={{ 
          fontSize: '0.8rem', 
          color: '#666', 
          textAlign: 'center', 
          marginTop: '0.5rem' 
        }}>
        </div>
      </div>
      <Button name="Apply Price" handleClick={handleSubmit} />
    </div>
  );
}

export default FilterByPrice;