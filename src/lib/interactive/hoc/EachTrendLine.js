import React, { Component } from "react";
import PropTypes from "prop-types";

import { noop } from "../../utils";
import { saveNodeType, isHover } from "../utils";
import { getCurrentItem } from "../../utils/ChartDataUtil";

import StraightLine from "../components/StraightLine";
import ClickableCircle from "../components/ClickableCircle";
import HoverTextNearMouse from "../components/HoverTextNearMouse";

class EachTrendLine extends Component {
	constructor(props) {
		super(props);

		this.handleEdge1Drag = this.handleEdge1Drag.bind(this);
		this.handleEdge2Drag = this.handleEdge2Drag.bind(this);
		this.handleLineDragStart = this.handleLineDragStart.bind(this);
		this.handleLineDrag = this.handleLineDrag.bind(this);
		this.handleDragComplete = this.handleDragComplete.bind(this);

		this.handleHover = this.handleHover.bind(this);

		this.isHover = isHover.bind(this);
		this.saveNodeType = saveNodeType.bind(this);
		this.nodes = {};

		this.state = {
			hover: false,
		};
	}
	handleLineDragStart() {
		const {
			x1Value, y1Value,
			x2Value, y2Value,
		} = this.props;

		this.dragStart = {
			x1Value, y1Value,
			x2Value, y2Value,
		};
	}
	handleLineDrag(moreProps) {
		const { index, onDrag } = this.props;

		const {
			x1Value, y1Value,
			x2Value, y2Value,
		} = this.dragStart;

		const { xScale, chartConfig: { yScale }, xAccessor, fullData } = moreProps;
		const { startPos, mouseXY } = moreProps;

		const x1 = xScale(x1Value);
		const y1 = yScale(y1Value);
		const x2 = xScale(x2Value);
		const y2 = yScale(y2Value);

		const dx = startPos[0] - mouseXY[0];
		const dy = startPos[1] - mouseXY[1];

		const newX1Value = xAccessor(getCurrentItem(xScale, xAccessor, [x1 - dx, y1 - dy], fullData));
		const newY1Value = yScale.invert(y1 - dy);
		const newX2Value = xAccessor(getCurrentItem(xScale, xAccessor, [x2 - dx, y2 - dy], fullData));
		const newY2Value = yScale.invert(y2 - dy);

		onDrag(index, {
			x1Value: newX1Value,
			y1Value: newY1Value,
			x2Value: newX2Value,
			y2Value: newY2Value,
		});
	}
	handleEdge1Drag(moreProps) {
		const { index, onDrag } = this.props;
		const {
			x2Value, y2Value,
		} = this.props;

		const [x1Value, y1Value] = getNewXY(moreProps);

		onDrag(index, {
			x1Value,
			y1Value,
			x2Value,
			y2Value,
		});
	}
	handleEdge2Drag(moreProps) {
		const { index, onDrag } = this.props;
		const {
			x1Value, y1Value,
		} = this.props;

		const [x2Value, y2Value] = getNewXY(moreProps);

		onDrag(index, {
			x1Value,
			y1Value,
			x2Value,
			y2Value,
		});
	}
	handleDragComplete() {
		const { index } = this.props;
		const { onDragComplete } = this.props;

		onDragComplete(index);
	}
	handleHover(moreProps) {
		if (this.state.hover !== moreProps.hovering) {
			this.setState({
				hover: moreProps.hovering
			});
		}
	}
	render() {
		const {
			x1Value,
			y1Value,
			x2Value,
			y2Value,
			type,
			stroke,
			strokeWidth,
			opacity,
			r,
			edgeStrokeWidth,
			edgeFill,
			edgeStroke,
			edgeInteractiveCursor,
			lineInteractiveCursor,
			hoverText,
			selected,

			onDragComplete,
		} = this.props;
		const { hover } = this.state;

		// console.log("SELECTED ->", selected);
		const { enable: hoverTextEnabled, ...restHoverTextProps } = hoverText;

		return <g>
			<StraightLine
				ref={this.saveNodeType("line")}
				selected={selected || hover}
				onHover={this.handleHover}
				onUnHover={this.handleHover}
				x1Value={x1Value}
				y1Value={y1Value}
				x2Value={x2Value}
				y2Value={y2Value}
				type={type}
				stroke={stroke}
				strokeWidth={(hover || selected) ? strokeWidth + 1 : strokeWidth}
				opacity={opacity}
				interactiveCursorClass={lineInteractiveCursor}
				onDragStart={this.handleLineDragStart}
				onDrag={this.handleLineDrag}
				onDragComplete={this.handleDragComplete} />
			<ClickableCircle
				ref={this.saveNodeType("edge1")}
				show={selected || hover}
				cx={x1Value}
				cy={y1Value}
				r={r}
				fill={edgeFill}
				stroke={edgeStroke}
				strokeWidth={edgeStrokeWidth}
				opacity={1}
				interactiveCursorClass={edgeInteractiveCursor}
				onDrag={this.handleEdge1Drag}
				onDragComplete={onDragComplete} />
			<ClickableCircle
				ref={this.saveNodeType("edge2")}
				show={selected || hover}
				cx={x2Value}
				cy={y2Value}
				r={r}
				fill={edgeFill}
				stroke={edgeStroke}
				strokeWidth={edgeStrokeWidth}
				opacity={1}
				interactiveCursorClass={edgeInteractiveCursor}
				onDrag={this.handleEdge2Drag}
				onDragComplete={this.handleDragComplete} />
			<HoverTextNearMouse
				show={hoverTextEnabled && hover && !selected}
				{...restHoverTextProps} />
		</g>;
	}
}

export function getNewXY(moreProps) {
	const { xScale, chartConfig: { yScale }, xAccessor, plotData, mouseXY } = moreProps;
	const [, mouseY] = mouseXY;

	const currentItem = getCurrentItem(xScale, xAccessor, mouseXY, plotData);
	const x = xAccessor(currentItem);
	const [small, big] = yScale.domain().sort();
	const y = yScale.invert(mouseY);
	const newY = Math.min(Math.max(y, small), big);
	return [x, newY];
}

EachTrendLine.propTypes = {
	x1Value: PropTypes.any.isRequired,
	x2Value: PropTypes.any.isRequired,
	y1Value: PropTypes.any.isRequired,
	y2Value: PropTypes.any.isRequired,

	index: PropTypes.number,

	stroke: PropTypes.string.isRequired,
	strokeWidth: PropTypes.number.isRequired,
	type: PropTypes.oneOf([
		"XLINE", // extends from -Infinity to +Infinity
		"RAY", // extends to +/-Infinity in one direction
		"LINE", // extends between the set bounds
	]).isRequired,

	onDrag: PropTypes.func.isRequired,
	onEdge1Drag: PropTypes.func.isRequired,
	onEdge2Drag: PropTypes.func.isRequired,
	onDragComplete: PropTypes.func.isRequired,
	onSelect: PropTypes.func.isRequired,
	onUnSelect: PropTypes.func.isRequired,

	r: PropTypes.number.isRequired,
	opacity: PropTypes.number.isRequired,
	defaultClassName: PropTypes.string,

	selected: PropTypes.bool,

	edgeStrokeWidth: PropTypes.number.isRequired,
	edgeStroke: PropTypes.string.isRequired,
	edgeInteractiveCursor: PropTypes.string.isRequired,
	lineInteractiveCursor: PropTypes.string.isRequired,
	edgeFill: PropTypes.string.isRequired,
	hoverText: PropTypes.object.isRequired,
};

EachTrendLine.defaultProps = {
	onDrag: noop,
	onEdge1Drag: noop,
	onEdge2Drag: noop,
	onDragComplete: noop,
	onSelect: noop,
	onUnSelect: noop,

	selected: false,

	edgeStroke: "#000000",
	edgeFill: "#FFFFFF",
	edgeStrokeWidth: 2,
	r: 5,
	strokeWidth: 1,
	opacity: 1,
	hoverText: {
		enable: false,
	}
};

export default EachTrendLine;