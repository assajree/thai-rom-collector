import { calculateCoverDimensions } from './image-processor.service';

describe('calculateCoverDimensions', () => {
  it('resizes landscape images to the maximum width', () => {
    expect(calculateCoverDimensions(500, 1000)).toEqual({ width: 250, height: 500 });
  });

  it('resizes portrait images to the maximum width', () => {
    expect(calculateCoverDimensions(1000, 500)).toEqual({ width: 250, height: 125 });
  });

  it('resizes large square images to 250 wide', () => {
    expect(calculateCoverDimensions(800, 800)).toEqual({ width: 250, height: 250 });
  });

  it('does not upscale images narrower than 250', () => {
    expect(calculateCoverDimensions(100, 500)).toEqual({ width: 100, height: 500 });
  });

  it('leaves images at exactly 250 wide unchanged', () => {
    expect(calculateCoverDimensions(250, 600)).toEqual({ width: 250, height: 600 });
  });
});
