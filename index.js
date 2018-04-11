var TENSION = 800
var FRICTION = 90

import React, { Component } from 'react'
import {
	AppRegistry,
	StyleSheet,
	TouchableWithoutFeedback,
	Text,
	Image,
	View,
	Animated,
	AlertIOS,
	PanResponder,
	Dimensions
} from 'react-native'

var SCREEN_HEIGHT = Dimensions.get('window').height
var DraggableDrawerHelper = require('./helper')(SCREEN_HEIGHT)

var createReactClass = require('create-react-class')
var component = createReactClass({
	getInitialState: function() {
		// naming it initialX clearly indicates that the only purpose
		// of the passed down prop is to initialize something internally
		var initialDrawerSize = DraggableDrawerHelper.calculateInitialPosition(
			this.props.initialDrawerSize
		)
		console.log(initialDrawerSize, 'Initila size')
		return {
			touched: false,
			// touched: 'TRUE',
			position: new Animated.Value(initialDrawerSize),
			initialPositon: initialDrawerSize
		}
	},

	onUpdatePosition: function(position) {
		this.state.position.setValue(position)
		this._previousTop = position
		console.log('Position ', position)
		var initialPosition = DraggableDrawerHelper.getInitialPosition()

		if (initialPosition === position) {
			this.props.onInitialPositionReached &&
				this.props.onInitialPositionReached()
		}
	},

	componentWillMount: function() {
		// Initialize the DraggableDrawerHelper that will drive animations
		DraggableDrawerHelper.setupAnimation(TENSION, FRICTION, position => {
			if (!this.center) return
			this.onUpdatePosition(position.value)
		})

		this._panGesture = PanResponder.create({
			onMoveShouldSetPanResponder: (evt, gestureState) => {
				return (
					DraggableDrawerHelper.isAValidMovement(
						gestureState.dx,
						gestureState.dy
					) && this.state.touched == true
				)
			},
			onPanResponderMove: (evt, gestureState) => {
				this.moveDrawerView(gestureState)
			},
			onPanResponderRelease: (evt, gestureState) => {
				this.moveFinished(gestureState)
			}
		})
	},

	moveDrawerView: function(gestureState) {
		console.log(gestureState.vy, 'GESTURE')
		if (!this.center) return
		var currentValue = Math.abs(gestureState.moveY / SCREEN_HEIGHT)
		var isGoingToUp = gestureState.vy < 0
		//Here, I'm subtracting %5 of screen size from edge drawer position to be closer as possible to finger location when dragging the drawer view
		var position = gestureState.moveY - SCREEN_HEIGHT * 0.05
		//Send to callback function the current drawer position when drag down the drawer view component
		if (!isGoingToUp) this.props.onDragDown(1 - currentValue)
		this.onUpdatePosition(position)
	},

	moveFinished: function(gestureState) {
		var isGoingToUp = gestureState.vy < 0
		if (!this.center) return
		DraggableDrawerHelper.startAnimation(
			gestureState.vy,
			gestureState.moveY,
			this.state.initialPositon,
			gestureState.stateId
		)
		this.props.onRelease && this.props.onRelease(isGoingToUp)
	},

	render: function() {
		var containerView = this.props.renderContainerView
			? this.props.renderContainerView()
			: null
		var drawerView = this.props.renderDrawerView
			? this.props.renderDrawerView()
			: null

		var drawerPosition = {
			top: this.state.position
		}

		return (
			<View style={styles.viewport}>
				<Animated.View
					style={[drawerPosition, styles.drawer]}
					ref={center => (this.center = center)}
					{...this._panGesture.panHandlers}
				>
					<TouchableWithoutFeedback
						onPressIn={() => {
							console.log('nice')
							this.setState({ touched: true })
						}}
						onPressOut={() => {
							this.setState({ touched: false })
						}}
					>
						{this.props.renderHandle()}
					</TouchableWithoutFeedback>

					{drawerView}
				</Animated.View>
			</View>
		)
	}
})

var styles = StyleSheet.create({
	viewport: {
		flex: 1
	},
	drawer: {
		flex: 1
	}
})

module.exports = component
