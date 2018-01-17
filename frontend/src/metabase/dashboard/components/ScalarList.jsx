import React, { Component } from "react";

import { connect } from "react-redux";

import { getByKeyScalar, getScalar, fetchScalars } from "metabase/dashboard/dashboard";
import { getAllScalars } from "metabase/dashboard/selectors";


const mapStateToPRops = (state, props) => ({
    scalars: fetchScalars
});

const mapDispatchToProps = {
    getAllScalars
};

@connect(mapStateToPRops, mapDispatchToProps)
class Scalars extends Component {
    componetWillMount() {
        this.props.getAllScalars();
    }
    render() {
        const scalarList = this.props.children(this.props.scalars);
        return scalarList && React.Children.only(scalarList);
    }
}

export default Scalars;
