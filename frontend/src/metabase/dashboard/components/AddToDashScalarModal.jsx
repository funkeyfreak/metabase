import React, { Component } from "react";
import { t } from 'c-3po';
import Button from "metabase/components/Button.jsx";
import ModalContent from "metabase/components/ModalContent.jsx";
import HeaderWithBack from "metabase/components/HeaderWithBack";
import ExpandingSearchField from "metabase/questions/components/ExpandingSearchField"

import Scalars from "./ScalarList";

export default class AddToDashScalarModal extends Component {
    state = {
        scalar: null,
        query: null
    };

    renderScalarByKey = () => {
        //TODO: funkeyfreak - will, this :P Make the scalars searchable by the entered in query
    };

    renderScalars = () => {
        return (
            <Scalars>
                {
                    scalars =>
                        <div>
                            {
                                scalars.length > 0
                                    ? (
                                        <ol>
                                            {
                                                scalars.map((scalar, index) =>
                                                    <li
                                                        className="text-brand-hover flex align-center border-bottom cursor-pointer py1 md-py2"
                                                        key={index}
                                                        onClick={() => this.setState({
                                                            scalar: scalar,
                                                            query: {scalar: scalar.slug}
                                                        })}
                                                    >
                                                        <Icon
                                                            className="mr2"
                                                            name="all"
                                                            style={{color: scalar.color}}
                                                        />
                                                        <h3>{scalar.name} {scalar.value} - {scalar.date}</h3>
                                                        <Icon
                                                            className="ml-auto"
                                                            name="chevronright"
                                                        />

                                                    </li>)
                                            }
                                            /*<li //TODO: funkeyfreak - I don't think we need this...
                                                className="text-brand-hover flex align-center border-bottom cursor-pointer py1 md-py2"
                                                onClick={() => this.setState({
                                                        scalar: {
                                                            name: "Non-Scalars"
                                                        },
                                                        query: { scalar:  ""}
                                                    })}
                                            >
                                                <Icon
                                                    className="mr2"
                                                    name="everything"
                                                />
                                                <h3> </h3>

                                            </li>*/
                                        </ol>
                                        //TODO: funkeyfreak - Make this more "beautiful"
                                    ) : "You have no scalars to display..."
                            }
                        </div>
                }
            </Scalars>
        )
    };

    render() {
        const { query, scalar } = this.state;
        return (
            <ModalContent
                title={t`Pick a scalar key to add, or add a new one`}
                className="px4 mb4 scroll-y"
                onClose={() => this.props.onClose()}
            >
                <div className="py1">
                    <div className="flex align-center">
                        { !query ?
                            //Add a field to react to the changes to scalar and the query object :D
                            <ExpandingSearchField
                                defaultValue={query && query.q}
                                onSearch={(value) => this.setState({
                                    scalar: null,
                                    query: { q: value }
                                })}
                            />
                            :
                            <HeaderWithBack
                                name={scalar && scalar.name}
                                onBack={() => this.setState({
                                    scalar: null,
                                    query:  null
                                })}
                            />
                        }
                        {
                            query
                            //we have entered a key - lets look it up
                            ? this.renderScalars()
                            : this.renderScalarByKey()
                        }
                    </div>
                </div>
            </ModalContent>
        );
    }

}

