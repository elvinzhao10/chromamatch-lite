# Color Transfer Algorithm

This implementation follows the color transfer method described in "Color Transfer between Images" by Reinhard et al. The algorithm transfers color characteristics from a target image to a source image using statistical analysis in the LAB color space.

## Algorithm Overview

The color transfer process consists of four main steps:

1. **RGB to LAB Conversion**: Convert both source and target images from RGB to LAB color space
2. **Statistical Analysis**: Compute mean and standard deviation for each LAB channel
3. **Color Transformation**: Apply the transformation formula to transfer color characteristics
4. **Output Generation**: Convert back to RGB and visualize results

## Mathematical Foundation

The core transformation formula for each LAB channel is:

```
result = (source - μ_source) × (σ_target / σ_source) + μ_target
```

Where:
- `μ` represents the mean
- `σ` represents the standard deviation
- The subscripts indicate source or target image statistics

## Features

- **Complete LAB Color Space Implementation**: Proper RGB↔LAB conversion
- **Statistical Analysis**: Detailed computation of color distribution statistics
- **Robust Transformation**: Handles edge cases like zero standard deviation
- **Comprehensive Visualization**: Side-by-side comparison with color histograms
- **Detailed Statistics**: Comparison of color characteristics before and after transfer

## Installation

```bash
pip install -r requirements.txt
```

## Usage

### Basic Usage with Synthetic Images

```python
python color_transfer.py
```

This will run a demonstration with synthetic images and save the result as `color_transfer_result.png`.

### Using with Your Own Images

```python
from color_transfer import ColorTransfer, load_and_resize_image

# Initialize the color transfer object
ct = ColorTransfer()

# Load your images
source_image = load_and_resize_image('path/to/source.jpg')
target_image = load_and_resize_image('path/to/target.jpg')

# Perform color transfer
result = ct.transfer_colors(source_image, target_image)

# Visualize results
ct.visualize_results(source_image, target_image, result, 'my_result.png')

# Print detailed statistics
ct.print_statistics_comparison()
```

## Code Structure

### ColorTransfer Class

- `rgb_to_lab()`: Converts RGB images to LAB color space
- `lab_to_rgb()`: Converts LAB images back to RGB color space
- `compute_color_statistics()`: Calculates mean and standard deviation for each channel
- `transfer_colors()`: Main algorithm implementation
- `visualize_results()`: Creates comprehensive visualization
- `print_statistics_comparison()`: Displays detailed statistical analysis

### Utility Functions

- `load_and_resize_image()`: Loads and optionally resizes images
- `main()`: Demonstration function with synthetic images

## Algorithm Details

### LAB Color Space

The LAB color space is perceptually uniform and separates:
- **L**: Lightness (0-100)
- **A**: Green-Red axis (-128 to +127)
- **B**: Blue-Yellow axis (-128 to +127)

### Statistical Transformation

For each LAB channel, the algorithm:
1. Subtracts the source mean (centering)
2. Scales by the ratio of target/source standard deviations
3. Adds the target mean (recentering)

This preserves the spatial relationships while matching the color distribution.

## Example Output

The algorithm generates:
- **Visual Comparison**: Source, target, and result images side by side
- **Color Histograms**: RGB channel distributions for all three images
- **Statistical Analysis**: Detailed numerical comparison of LAB statistics

## Technical Notes

- Images are automatically resized to a maximum dimension of 800 pixels for efficiency
- The algorithm handles edge cases like zero standard deviation
- OpenCV is used for robust color space conversions
- Results are clipped to valid RGB ranges [0, 255]

## References

Reinhard, E., Adhikhmin, M., Gooch, B., & Shirley, P. (2001). Color transfer between images. IEEE Computer Graphics and Applications, 21(5), 34-41.