# bar-card

![](images/default_increase.gif)
![](images/default_decrease.gif)

## Options

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| type | string | **Required** | `custom:bar-card`
| title | string | none | Title displayed next to the bar.
| entity | string | **Required** | Entity State
| animation_mode | string | auto | Sets the mode of animation (auto, charge, off).
| hue | number | 220 | Changed the color hue of the bar (0-360).
| saturation | string | 50% | Scales saturation of the bar.
| scale | string | 40px | Scales the height of the bar.
| min | number | 0 | The minimum entity value to be displayed.
| max | number | 100 | The maximum entity value to be displayed.
| speed | number | 2500 | The speed of the bar animation in milliseconds.
| delay | number| 7500 | The amout of time between the bar animation loop in milliseconds.
| from | string | left | Direction of the bar.
| severity | object | none | A list of severity values.
| border_radius | string | 3px | Amount of corner rounding of the bar.

## Default

![](images/default_increase.gif)

```yaml
- type: custom:bar-card
  title: Default
  entity: sensor.default
```
## Hue

![](images/hue.gif)

```yaml
- type: custom:bar-card
  title: Default
  entity: sensor.default
  hue: 300
```

Based on [Big Number Card](https://github.com/ciotlosm/custom-lovelace/tree/master/bignumber-card) by [ciotlosm](https://github.com/ciotlosm)
