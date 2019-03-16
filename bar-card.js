class BarCard extends HTMLElement {
  constructor () {
    super()
    this.attachShadow({ mode: 'open' })
  }
  setConfig (config) {
    // Throw error if no entity defined
    if (!config.entity) throw new Error('Please define an entity')

    // Default Card variables
    if (!config.height) config.height = '40px'
    if (!config.direction) config.direction = 'right'
    if (!config.rounding) config.rounding = '3px'
    if (!config.title_position) config.title_position = 'left'
    if (!config.indicator) config.indicator = 'auto'
    if (!config.saturation) config.saturation = '50%'
    if (!config.animation) config.animation = 'auto'
    if (!config.speed) config.speed = 1000
    if (!config.delay) config.delay = 5000
    if (!config.min) config.min = 0
    if (!config.max) config.max = 100

    // Check if title position is inside
    if (!config.width) {
      if (config.title_position != 'inside') {
        config.width = '70%'
      } else {
        config.width = '100%'
      }
    }


    // Create CSS style variables
    if (config.bar_style) var barStyle = this._customStyle(config.bar_style)
    if (config.title_style) var titleStyle = this._customStyle(config.title_style)
    if (config.indicator_style) var indicatorStyle = this._customStyle(config.indicator_style)
    if (config.card_style) var cardStyle = this._customStyle(config.card_style)

    // Sets position of the title
    let titleAlign
    let titleWidth
    let flexDirection
    switch (config.title_position) {
      case 'left':
        titleWidth = 'width: calc(100% - ' + config.width + ');'
        titleAlign = 'justify-content: flex-start;'
        flexDirection = 'flex-direction: row;'
        break
      case 'right':
        titleWidth = 'width: calc(100% - ' + config.width + ');'
        titleAlign = 'justify-content: flex-start;'
        flexDirection = 'flex-direction: row-reverse;'
        break
      case 'top':
        titleWidth = 'width: 100%;'
        titleAlign = 'justify-content: center;'
        flexDirection = 'flex-direction: column;'
        break
      case 'bottom':
        titleWidth = 'width: 100%;'
        titleAlign = 'justify-content: center;'
        flexDirection = 'flex-direction: column-reverse;'
        break
    }

    // Set marker direction based on card direction
    let markerDirection
    let barFrom
    switch (config.direction) {
      case 'left':
        barFrom = 'left'
        markerDirection = 'right'
        break
      case 'right':
        barFrom = 'right'
        markerDirection = 'left'
        break
      case 'up':
        barFrom = 'top'
        markerDirection = 'bottom'
        break
      case 'down':
        barFrom = 'bottom'
        markerDirection = 'top'
        break
    }

    // Create card elements
    const card = document.createElement('ha-card')
    const container = document.createElement('div')
    container.id = 'container'
    const background = document.createElement('div')
    background.id = 'background'
    const backgroundBar = document.createElement('div')
    backgroundBar.id = 'backgroundBar'
    const bar = document.createElement('div')
    bar.id = 'bar'
    const value = document.createElement('div')
    value.id = 'value'
    const style = document.createElement('style')

    // Check if animation is enabled
    if (config.animation !== "off") {
      var chargeBar = document.createElement('div')
      chargeBar.id = 'chargeBar'
    }

    // Check if target is defined
    if (config.target) {
      var targetBar = document.createElement('div')
      targetBar.id = 'targetBar'
      var targetBarColor = document.createElement('div')
      targetBarColor.id = 'targetBarColor'
      var targetMarker = document.createElement('div')
      targetMarker.id = 'targetMarker'
      var targetMarkerColor = document.createElement('div')
      targetMarkerColor.id = 'targetMarkerColor'
    }

    // Check if indicator is enabled
    if (config.indicator !== "off"){
      var indicatorContainer = document.createElement('div')
      indicatorContainer.id = 'indicatorContainer'
      var indicatorBar = document.createElement('div')
      indicatorBar.id = 'indicatorBar'
      var indicator = document.createElement('div')
      indicator.id = 'indicator'
      var indicatorColor = document.createElement('div')
      indicatorColor.id = 'indicatorColor'
    }

    // Check if title is not inside
    if (config.title !== "inside"){
      var title = document.createElement('div')
      title.id = 'title'
      var titleBar = document.createElement('div')
      titleBar.id = 'titleBar'
      title.textContent = config.title
    }

    // Set marker style based on bar direction
    let markerStyle
    if (barFrom == 'left' || barFrom == 'right') {
      markerStyle = `
      #targetMarker, #targetMarkerColor {
        position: absolute;
        background: #FFF0;
        ` + markerDirection + `: var(--targetMarker-percent);
        height: ${config.height};
        border-left: 2px dashed var(--targetMarker-color);
      }
      #targetMarkerColor {
        border-left: 2px dashed var(--bar-fill-color);
      }
      `
    } else {
      markerStyle = `
      #targetMarker, #targetMarkerColor {
        position: absolute;
        background: #FFF0;
        ` + markerDirection + `: var(--targetMarker-percent);
        width: 100%;
        border-top: 2px dashed var(--targetMarker-color);
      }
      #targetMarkerColor {
        border-top: 2px dashed var(--bar-fill-color);
      }
      `
    }

    // Set CSS styles
    style.textContent = `
      ha-card {
        background-color: var(--paper-card-background-color);
        padding: 4px;
        ` + cardStyle + `
      }
      #container {
        display: flex;
        align-items: center;
        justify-content: center;
        ` + flexDirection + `
      }
      #background {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: ${config.width};
        height: ${config.height};
      }
      #title {
        color: var(--primary-text-color);
        padding-left: 10px;
        padding-right: 10px;
        ` + titleStyle + `
      }
      #titleBar {
        position: relative;
        display: flex;
        align-items: center;
        height: 40px;
        ` + titleAlign + `
        ` + titleWidth + `
        ` + titleStyle + `
      }
      #bar, #backgroundBar, #targetBar, #targetBarColor, #valueBar, #chargeBar, #chargeBarColor, #valueBar, #indicatorBar {
        position: absolute;
        height: 100%;
        width: 100%;
        border-radius: ${config.rounding};
        ` + barStyle + `
      }
      #backgroundBar {
        background: var(--bar-background-color);
      }
      #bar {
        background: linear-gradient(to ${barFrom}, var(--bar-fill-color) var(--bar-percent), #0000 var(--bar-percent), #0000 var(--bar-percent));
      }
      #chargeBar {
        background: linear-gradient(to ${barFrom}, #FFF0 var(--bar-percent), var(--bar-charge-color) var(--bar-percent), var(--bar-charge-color) var(--bar-charge-percent), #FFF0 var(--bar-charge-percent));
      }
      #targetBar {
        background: linear-gradient(to ${barFrom}, #FFF0 var(--targetBar-left-percent), var(--targetBar-color) var(--targetBar-left-percent), var(--targetBar-color) var(--targetBar-right-percent), #FFF0 var(--targetBar-right-percent));
        mix-blend-mode: difference;
      }
      #targetBarColor {
        background: linear-gradient(to ${barFrom}, #FFF0 var(--targetBar-left-percent), var(--bar-fill-color) var(--targetBar-left-percent), var(--bar-fill-color) var(--targetBar-right-percent), #FFF0 var(--targetBar-right-percent));
        mix-blend-mode: color;
      }
      #value {
        white-space: pre-line;
        z-index: 1;
        text-align: center;
        font-weight: bold;
        color: #FFF;
        text-shadow: 1px 1px #000;
        ` + barStyle + `
      }
      #indicatorBar {
        display: flex;
        align-items: var(--flex-align);
        justify-content: var(--flex-justify);
      }
      #indicator, #indicatorColor {
        width: 25px;
        text-align: center;
        position: static;
        mix-blend-mode: difference;
        color: #7F7F7F;
        opacity: 0.75;
        text-shadow: 0px 0px;
        ` + indicatorStyle + `
      }
      #indicatorColor {
        margin-left: -25px;
        color: var(--bar-fill-color);
        mix-blend-mode: color;
        opacity: 1;
        ` + indicatorStyle + `
      }
      #indicatorContainer {
        display: flex;
        margin-top: 5px;
        margin-bottom: 5px;
      }
      ` + markerStyle + `
    `

    // Start building card
    background.appendChild(backgroundBar)
    background.appendChild(bar)

    // Check if animation is not disabled
    if (config.animation !== "off") {
      background.appendChild(chargeBar)
    }

    // Check if target is configured
    if (config.target) {
      targetBar.appendChild(targetMarker)
      targetBarColor.appendChild(targetMarkerColor)
      background.appendChild(targetBar)
      background.appendChild(targetBarColor)
    }

    // Check if indicator is not disabled
    if (config.indicator != 'off') {
      indicatorContainer.appendChild(indicator)
      indicatorContainer.appendChild(indicatorColor)
      indicatorBar.appendChild(indicatorContainer)
      background.appendChild(indicatorBar)
    }

    // Select title position
    switch (config.title_position) {
      case 'left':
      case 'right':
      case 'top':
      case 'bottom':
        if (config.title_position != 'inside') {
          titleBar.appendChild(title)
          container.appendChild(titleBar)
        }
        container.appendChild(background)
        break
      case 'inside':
        container.appendChild(background)
    }

    background.appendChild(value)
    card.appendChild(container)
    card.appendChild(style)

    // Add on click event to card
    card.addEventListener('click', event => {
      this._showAttributes('hass-more-info', { entityId: config.entity })
    })

    this.shadowRoot.appendChild(card)
    this._config = config
  }

  // Create style string from CSS options
  _customStyle (style) {
    let styleString = ''
    Object.keys(style).forEach(section => {
      styleString = styleString + section + ':' + style[section] + '; '
    })
    return styleString
  }

  // Translates entity percentage to bar percentage
  _translatePercent (value, min, max) {
    return 100 * (value - min) / (max - min)
  }

  // Map range function
  _scale (num, in_min, in_max, out_min, out_max) {
    return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min
  }

  // Returns hue value based on severity array
  _computeSeverity (stateValue, sections) {
    let numberValue = Number(stateValue)
    let hue
    sections.forEach(section => {
      if (numberValue <= section.value && !hue) {
        hue = section.hue
      }
    })
    return hue
  }

  // Check if value is NaN, otherwise assume it's an entity
  _valueEntityCheck (value, hass) {
    if (isNaN(value)) {
      if (hass.states[value] == undefined) throw new Error('Invalid target, min or max entity')
      else return hass.states[value].state
    } else {
      return value
    }
  }

  // Press action
  _showAttributes (type, detail, options) {
    const node = this.shadowRoot
    options = options || {}
    detail = (detail === null || detail === undefined) ? {} : detail
    const event = new Event(type, {
      bubbles: options.bubbles === undefined ? true : options.bubbles,
      cancelable: Boolean(options.cancelable),
      composed: options.composed === undefined ? true : options.composed
    })
    event.detail = detail
    node.dispatchEvent(event)
    return event
  }

  // Update bar percentages
  _updateBar (entityState, hass) {
    const config = this._config
    const root = this.shadowRoot
    if (this._valueEntityCheck(config.min, hass) !== undefined && this._valueEntityCheck(config.max, hass) !== undefined) {
      root.getElementById('bar').style.setProperty('--bar-percent', `${this._translatePercent(entityState, this._valueEntityCheck(config.min, hass), this._valueEntityCheck(config.max, hass))}%`)
      root.getElementById('bar').style.setProperty('--bar-charge-percent', `${this._translatePercent(entityState, this._valueEntityCheck(config.min, hass), this._valueEntityCheck(config.max, hass))}%`)
    }
  }

  // Create animation
  _updateAnimation (entityState, configDirection, configDuration, hue, configStop) {
    const config = this._config
    const root = this.shadowRoot
    const element = root.getElementById('chargeBar')

    let currentPercent = this._translatePercent(entityState, this._valueEntityCheck(config.min, this._hass), this._valueEntityCheck(config.max, this._hass))
    let totalFrames = ((currentPercent) * 10) + (config.delay / (config.speed / 250))
    let scaledPercent = (currentPercent) * 10

    if (configStop == true) {
      configDuration = 0
    }

    let options = {
      iterations: Infinity,
      iterationStart: 0,
      delay: 0,
      endDelay: 0,
      direction: 'normal',
      duration: configDuration,
      fill: 'both'
    }

    let keyframes = []
    let i = scaledPercent
    if (configDirection == 'normal') {
      for (; i <= totalFrames;) {
        let opacity = this._scale(i / 10, currentPercent, currentPercent + 25, 1, 0)
        let keyframe = {'--bar-charge-percent': i / 10 + '%', '--bar-percent': currentPercent + '%', '--bar-charge-color': 'hsla(' + hue + ', 75%, 25%, ' + opacity + ')'}
        keyframes.push(keyframe)
        i++
      }
    }
    if (configDirection == 'reverse') {
      for (; i <= totalFrames;) {
        const reversePercent = currentPercent - ((i - scaledPercent) / 10)
        let opacity = this._scale(i / 10, currentPercent, currentPercent + 25, 1, 0)
        let keyframe = {'--bar-charge-percent': currentPercent + '%', '--bar-percent': reversePercent + '%', '--bar-charge-color': 'hsla(' + hue + ', 75%, 25%, ' + opacity + ')'}
        keyframes.push(keyframe)
        i++
      }
    }
    return element.animate(keyframes, options)
  }

  // Sets position and direction of the indicator
  _updateIndicator (position, direction) {
    const config = this._config
    const root = this.shadowRoot
    switch (position) {
      case 'right':
        root.getElementById('indicatorBar').style.setProperty('--flex-align', 'center')
        root.getElementById('indicatorBar').style.setProperty('--flex-justify', 'flex-end')
        break
      case 'left':
        root.getElementById('indicatorBar').style.setProperty('--flex-align', 'center')
        root.getElementById('indicatorBar').style.setProperty('--flex-justify', 'flex-start')
        break
      case 'top':
        root.getElementById('indicatorBar').style.setProperty('--flex-align', 'flex-start')
        root.getElementById('indicatorBar').style.setProperty('--flex-justify', 'center')
        break
      case 'bottom':
        root.getElementById('indicatorBar').style.setProperty('--flex-align', 'flex-end')
        root.getElementById('indicatorBar').style.setProperty('--flex-justify', 'center')
        break
      case 'auto':
        switch (direction) {
          case 'up':
            root.getElementById('indicatorBar').style.setProperty('--flex-align', 'center')
            root.getElementById('indicatorBar').style.setProperty('--flex-justify', 'flex-end')
            break
          case 'down':
            root.getElementById('indicatorBar').style.setProperty('--flex-align', 'center')
            root.getElementById('indicatorBar').style.setProperty('--flex-justify', 'flex-start')
            break
        }
        break
      case 'auto-vertical':
        switch (direction) {
          case 'up':
            root.getElementById('indicatorBar').style.setProperty('--flex-align', 'flex-start')
            root.getElementById('indicatorBar').style.setProperty('--flex-justify', 'center')
            break
          case 'down':
            root.getElementById('indicatorBar').style.setProperty('--flex-align', 'flex-end')
            root.getElementById('indicatorBar').style.setProperty('--flex-justify', 'center')
            break
        }
    }
    if (config.indicator != 'off') {
      switch (direction) {
        case 'up':
          root.getElementById('indicator').textContent = '▲'
          root.getElementById('indicatorColor').textContent = '▲'
          break
        case 'down':
          root.getElementById('indicator').textContent = '▼'
          root.getElementById('indicatorColor').textContent = '▼'
          break
      }
    }
  }

  // Scale the target bar size
  _updateTargetBar (entityState, target, color, markerColor) {
    const config = this._config
    const root = this.shadowRoot

    let currentPercent = this._translatePercent(entityState, this._valueEntityCheck(config.min, this._hass), this._valueEntityCheck(config.max, this._hass))
    let targetPercent = this._translatePercent(target, this._valueEntityCheck(config.min, this._hass), this._valueEntityCheck(config.max, this._hass))

    let initialPercent
    let diffPercent
    if (currentPercent > targetPercent) {
      initialPercent = targetPercent
      diffPercent = currentPercent
    } else {
      initialPercent = currentPercent
      diffPercent = targetPercent
    }
    root.getElementById('targetBar').style.setProperty('--targetBar-left-percent', initialPercent + '%')
    root.getElementById('targetBarColor').style.setProperty('--targetBar-left-percent', initialPercent + '%')
    root.getElementById('targetBar').style.setProperty('--targetBar-right-percent', diffPercent + '%')
    root.getElementById('targetBarColor').style.setProperty('--targetBar-right-percent', diffPercent + '%')
    root.getElementById('targetBar').style.setProperty('--targetBar-color', color)

    root.getElementById('targetMarker').style.setProperty('--targetMarker-percent', targetPercent + '%')
    root.getElementById('targetMarkerColor').style.setProperty('--targetMarker-percent', targetPercent + '%')
    root.getElementById('targetMarker').style.setProperty('--targetMarker-color', markerColor)
  }

  // On hass update
  set hass (hass) {
    this._hass = hass
    const config = this._config
    const root = this.shadowRoot

    // Define variables that have possible entities
    let configTarget
    if (config.target) configTarget = this._valueEntityCheck(config.target, hass)
    const configMin = this._valueEntityCheck(config.min, hass)
    const configMax = this._valueEntityCheck(config.max, hass)

    // Check for unknown state
    let entityState
    if (hass.states[config.entity] == undefined || hass.states[config.entity].state == 'unknown') {
      entityState = 'N/A'
    } else {
      if (config.attribute) {
        entityState = hass.states[config.entity].attributes[config.attribute]
      } else {
        entityState = hass.states[config.entity].state
      }
      entityState = Math.min(entityState, configMax)
      entityState = Math.max(entityState, configMin)
    }
    let measurement
    if (hass.states[config.entity] == undefined || hass.states[config.entity].state == 'unknown') measurement = ''
    else if (config.unit_of_measurement) measurement = config.unit_of_measurement
    else measurement = hass.states[config.entity].attributes.unit_of_measurement || ''

    // Set color hue
    let hue
    if (!config.severity) {
      hue = 220
      if (config.hue) {
        hue = config.hue
      }
    } else {
      hue = this._computeSeverity(entityState, config.severity)
    }

    // Set style variables
    const barColor = 'hsl(' + hue + ',' + config.saturation + ',50%)'
    const targetColor = 'hsla(' + hue + ',' + config.saturation + ',50%,0.25)'
    const targetMarkerColor = 'hsla(' + hue + ',' + config.saturation + ',50%,0.5)'
    const backgroundColor = 'hsla(' + hue + ',' + config.saturation + ',15%,0.5)'

    // On entity update
    if (entityState !== this._entityState) {
      this._updateBar(entityState, hass)
      if (config.target) {
        this._updateTargetBar(entityState, configTarget, targetColor, targetMarkerColor)
        this._entityTarget = configTarget
      }
      root.getElementById('bar').style.setProperty('--bar-fill-color', barColor)
      root.getElementById('backgroundBar').style.setProperty('--bar-background-color', backgroundColor)
      if (config.indicator != 'off') root.getElementById('indicatorColor').style.setProperty('--bar-fill-color', barColor)
      if (config.target) {
        root.getElementById('targetBarColor').style.setProperty('--bar-fill-color', barColor)
        root.getElementById('targetMarkerColor').style.setProperty('--bar-fill-color', barColor)
      }
      if (config.title_position == 'inside') {
        root.getElementById('value').textContent = `${config.title} \r\n${entityState} ${measurement}`
      } else {
        root.getElementById('value').textContent = `${entityState} ${measurement}`
      }
    }

    // Select 'auto' animation
    if (config.animation == 'auto') {
      if (entityState > this._entityState) {
        this._updateIndicator(config.indicator, 'up')
        this._currentAnimation = this._updateAnimation(entityState, 'normal', config.delay, hue, config.saturation, false)
      }
      if (entityState < this._entityState) {
        this._updateIndicator(config.indicator, 'down')
        this._currentAnimation = this._updateAnimation(entityState, 'reverse', config.delay, hue, config.saturation, false)
      }
      if (entityState == configMax || entityState == configMin) {
        if (config.indicator != 'off') {
          root.getElementById('indicator').textContent = ''
          root.getElementById('indicatorColor').textContent = ''
        }
        if (entityState == configMax) {
          root.getElementById('bar').style.setProperty('--bar-percent', '100%')
          root.getElementById('bar').style.setProperty('--bar-fill-color', barColor)
          root.getElementById('bar').style.setProperty('--bar-charge-percent', '100%')
          if (this._currentAnimation) {
            this._currentAnimation.pause()
          }
        }
        if (entityState == configMin) {
          root.getElementById('bar').style.setProperty('--bar-percent', '0%')
          root.getElementById('bar').style.setProperty('--bar-charge-percent', '0%')
          if (this._currentAnimation) {
            this._currentAnimation.pause()
          }
        }
      }
    }

    // Select 'charge' animation
    if (config.animation == 'charge') {
      let chargeEntityState
      if (!config.charge_entity) {
        entityState = "define 'charge_entity'"
        measurement = ''
        root.getElementById('value').style.setProperty('color', '#FF0000')
      } else {
        chargeEntityState = hass.states[config.charge_entity].state
      }
      switch (chargeEntityState) {
        case "charging":
        case "on":
        case "true":
          this._updateIndicator(config.indicator, 'up')
          if (!this._currentAnimation || chargeEntityState != this._currentChargeState || entityState > this._entityState) {
            this._currentChargeState = chargeEntityState
            this._currentAnimation = this._updateAnimation(entityState, 'normal', config.delay, hue, config.saturation, false)
          }
          break
        case "discharging":
        case "off":
        case "false":
          if (chargeEntityState == 'discharging' || chargeEntityState == 'off' || chargeEntityState == 'false') {
            this._updateIndicator(config.indicator, 'down')   
            if (!this._currentAnimation || chargeEntityState != this._currentChargeState || entityState < this._entityState) {
              this._currentChargeState = chargeEntityState
              this._currentAnimation = this._updateAnimation(entityState, 'reverse', config.delay, hue, config.saturation, false)
            }
          }
          break
      }
    }

    // Select 'off' animation
    if (config.animation == "off") {
      if (entityState > this._entityState) {
        this._updateIndicator(config.indicator, 'up')
      }
      if (entityState < this._entityState) {
        this._updateIndicator(config.indicator, 'down')
      } 
    }
    
    // On target update
    if (config.target) {
      if (configTarget != this._entityTarget) {
        this._updateTargetBar(entityState, configTarget, targetColor, targetMarkerColor)
        this._entityTarget = configTarget
      }
    }

    // On min update
    if (configMin !== this._currentMin) {
      this._updateBar(entityState, hass)
      this._currentMin = configMin
      if (config.target) {
        this._updateTargetBar(entityState, configTarget, targetColor, targetMarkerColor)
        this._entityTarget = configTarget
      }
    }

    // On max update
    if (configMax !== this._currentMax) {
      this._updateBar(entityState, hass)
      this._currentMax = configMax
      if (config.target) {
        this._updateTargetBar(entityState, configTarget, targetColor, targetMarkerColor)
        this._entityTarget = configTarget
      }
    }
    this._entityState = entityState
  }
  getCardSize () {
    return 1
  }
}

customElements.define('bar-card', BarCard)
