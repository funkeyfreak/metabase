import React, { Component } from "react";

import { connect } from "react-redux";

import ScalarForm from "./ScalarForm.jsx";

const mapStateToProps = (state, props) => ({
    scalar: state.dashboard.scalars.filter(s => s.id = props.id),
});

@connect(mapStateToProps)
export default class CollectionEdit extends Component {
    props: {
        id: number,
        handleSubmit: Function,
        isOpen: boolean,
        onClose: Function,
        onSubmit: Function
    };
    constructor(props){
        super(props)
        console.debug("The props of the renderer");
        console.debug(props)
    }
    render() {
        if(this.props.scalar == null){
            return (
                <ScalarForm
                    {...this.props}
                />
            );
        } else {
            return (
                <ScalarForm
                    {...this.props}
                    initialValues={this.props.scalar}
                />
            );
        }

    }
}
