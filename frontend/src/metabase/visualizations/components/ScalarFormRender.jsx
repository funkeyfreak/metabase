import React, { Component } from "react";

import { connect } from "react-redux";

import ScalarForm from "./ScalarForm.jsx";

const mapStateToProps = (state, props) => ({
    scalar: state.dashboard.scalar,
});

@connect(mapStateToProps)
export default class CollectionEdit extends Component {
    props: {
        handleSubmit: Function,
        isOpen: boolean,
        onClose: Function,
        onSubmit: Function
    };
    render() {
        return (
            <ScalarForm
                {...this.props}
            />
        );
    }
}
