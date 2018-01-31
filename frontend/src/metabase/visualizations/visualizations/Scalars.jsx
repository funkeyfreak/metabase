/*@flow*/
import React, { Component } from "react";
import { connect } from 'react-redux';
import cx from "classnames";


import moment from 'moment';
import Tooltip from "metabase/components/Tooltip";
import ScalarForm from "../components/ScalarForm";
import Icon from "metabase/components/Icon.jsx";
import Ellipsified from "metabase/components/Ellipsified.jsx";

import 'react-datepicker/dist/react-datepicker.css';
import styles from "./Scalars.css";
import { getKeyScalar, getScalar, fetchScalars, saveScalar, fetchKeyDateScalar, deleteScalar, getScalars }  from "metabase/dashboard/dashboard"

import Stats from "../lib/stats"

//TODO: funkeyfreak - need to import ChartSettingSelect inorder to make date filterable

import type { VisualizationProps } from "metabase/meta/types/Visualization";

const mapStateToProps = state => ({
    scalar: state.dashboard.scalar,
    scalars: state.dashboard.scalars,
    scalarList: state.dashboard.scalarList,
    scalarSearch: state.dashboard.scalarSearch,
    scalarNames: state.dashboard.scalarNames,
});

const mapDispatchToProps = {
    saveScalar,
    getKeyScalar,
    getScalar,
    fetchScalars,
    fetchKeyDateScalar,
    deleteScalar,
    getScalars,
};

const HEADER_ICON_SIZE = 16;

const HEADER_ACTION_STYLE = {
   padding: 4
};


export type DisProps = {
    rangeType: {
        date: {start: Date, end: Date},
        count: number
    },
    visType: string,
    maths:   string
};

export type Scalar = {
    id: number,
    name: string,
    description: string,
    value: number,
    date: string,
};

type State = {
    scalarId: number,
    scalarKey: string,
    text: string,
    modalState: {
        isOpen: boolean,
        save: boolean,
    },
    reference: Scalar
};

/*NOTE Scratch space
const VisType = new Map();
VisType.set("%%",{}); // show percentages
VisType.set("##", {}); // show a number
VisType.set("//", {}); // show a fraction representing (curr||sel)/(calc({...Scalars}))
VisType.set("><", {}); // show if it's greater or less than it's predecessor

const Maths = new Map();
Maths.set("avgCurr", {}); // a simple average against the most current
Maths.set("avgSel", {}); // a simple average against the current
Maths.set("trendCurr", {}); // a weighted average of values set against the most recent
Maths.set("trendSel", {}); // a weighted average of values set against the selected
Maths.set("current"); // the most up-to-date scalar of name { key }
Maths.set("selected"); // the selected scalar

const ConstDirrArr = new Map();
ConstDirrArr.set("up","&uparrow");
ConstDirrArr.set("down", "&downarrow");
*/

export class Scalars extends Component {
    props: VisualizationProps;
    state: State;

    constructor(props: VisualizationProps){
        //TODO: funkeyfreak - bind all the functions => https://stackoverflow.com/questions/44406599/calling-a-function-from-another-in-reactjs
        super(props);

        this.state = {
            scalarId: 0,
            scalarKey: "",
            text: "",
            uniqueKeys: [],
            modalState: {
                isOpen: false,
                save: false
            },
        };
    }

    static uiName = "Scalars";
    static identifier = "scalars";
    static iconName = "scalars";

    static disableSettingsConfig = true;
    static noHeader = true;
    static supportsSeries = false;
    static hidden = true;

    static minSize = { width: 3, height: 3 };

    //reference the rendered text
    //_renderedText: ?HTMLElement; //TODO: funkeyfreak -  fixthis, will allow capture of rendered scalar visualization
    //TODO: from [dalinwilliams on 1/31/18 @ 10:49 AM]: Add scalar stat storage here
    //static scalarStats = {};

    static Scalar = {
        id: 0,
        name: "",
        description: "",
        value: 0,
        date: ""
    };

    //default display properties
    static displayProperties = {
        rangeType: {
            date: null,
            count: 0
        },
        visType: "",
        maths:   "selected",
    };

    //Settings structure
    static settings = {
        "scalars.SCALAR": { //TODO: funkeyfreak - rename to scalar.SCALAR
            value: 0,
            default: 0
        },
        "text": { //use this field to store the scalars text
            value: "",
            default: ""
        },
        "dirty": {
            value: false
        },
        "scalars.reference": {
            /*"id": null, NOTE - one does not need to define any values - they will be satasified by VisualizationProps.settings. This makes this.settings available in the renderer
            "name": null,
            "description": null,
            "value": null,
            "date": ""*/
        },
        "scalars.DisplayProperties": {
            rangeType: {
                date: null,
                count: 0
            },
            visType: "",
            maths:   ""

        },
        "stats":{
            mean: null,
            median: null,
            mode: null,
            cdf: null,
            pdf: null
        }

    };

    static checkRenderable() {
        // TODO: funkeyfreak - you may need to refresh the scalar API query before this happens
    }

    //-------------- STATIC FUNCTIONS

    saveupdatescalar(scalar){
        //validate the date one more time
        scalar.date = moment(scalar.date);
        this.props.saveScalar(scalar);
        //set the settings to refresh - to not be AS greedy (hopefully)
        this.props.onUpdateVisualizationSettings({"dirty": true});

        console.debug("sent the scalar to be saved");
        //close the modal - to lazy to do
        let m = this.state.modalState;
        m.isOpen = false;
        this.setState({
            modalState: m
        });
    }

    //-------------- REACT NATIVE FUNCTIONS

    componentWillMount(){
        //load all the scalars
        this.props.getScalars();
        if(!this.props.settings){
            //TODO - funkeyfreak - Eventually get props/set props her
            //this.props.onUpdateVisualizationSettings( "scalars.reference": {});
            //We can set state concerning the validity of an id here....
            //this.setState({});
        }

    }

    componentDidMount(){
        if (this.props.settings) {
            let id = this.props.settings["scalars.SCALAR"];
            let scalar = this.props.settings["scalars.reference"];
            // use dispProps to store display properties
            let dispProps = this.props.settings["scalars.DisplayProperties"];

            //fetch what needs to be fetched
            if (scalar && scalar != null && id && id != null) {
                let {ids } = scalar;
                // double to allow for string comp
                if (id == ids) {
                    //TODO: funkeyfreak - programmatic filtering from the back-end api - moves logic forward
                    //this.props.getScalar(id);
                    /*if (dispProps.rangeType.date) {
                        //fetchKeyDateScalar already accepts a object with start and end!
                        //TODO: funkeyfreak - fetch scalars and filter by date
                        //this.props.fetchKeyDateScalar(key, dispProps.rangeType.date)
                    } else if (dispProps.rangeType.count) {
                        //TODO: funkeyfreak - this would be awesome to have
                    }*/
                } else {
                    console.debug("Ids given do not match, id: " + id + " ids: " + ids);
                }
            }
        }
    }

    componentWillUpdate(){
        //TODO: funkeyfreak - add state handler of current props?
    }

    componentWillReceiveProps(newProps: VisualizationProps) {
        //if we are editing the dashboard
        if(!this.props.isEditing && newProps.isEditing) {
            //Do stuff
        }

        //update the visuals for rendering
        if (!this.props.isEditing && !newProps.isEditing){

        }

        if(newProps.scalar != null){
            //TODO: funkeyfreak - check loaded sclarList - maybe the mounted list already matches the scalar key
            //this bit is a bit greedy...
            let scalar = newProps.scalar;
            let { id } = scalar;
            let scalars = newProps.scalarList;
            if( scalars != null && scalars.length > 1) {
                //TODO: Add stats work here?
            }
            //update the settings, if they are dirty
            if(newProps.settings.dirty){
                this.props.onUpdateVisualizationSettings({"dirty": false,
                    "scalars.SCALAR": id,
                    "scalars.reference": scalar});
            }
            this.setState({
                reference: newProps.scalar,
                scalarId: newProps.scalar.id,
                scalarKey: newProps.scalar.name,
            });
        }
    }
    componentDidUpdate(){
        //TODO: funkeyfreak - this is where we can refresh the scalar via the scalar api after user entry via a form
    }



    //---------------------------ACTIONS

    onScalarClicked (){
        //TODO: funkeyfreak - launch modal from click of the actual modal
    }

    onModalOpenClick(){
        let m = this.state.modalState;
        //TODO: funkeyfreak - if the modal is about to be opened, load the selected scalar into state
        /*if(!m.isOpen && this.props.settings && this.props.settings["scalars.SCALAR"]){
            this.props.getScalar(this.props.settings["scalars.SCALAR"]);
        }*/
        m.isOpen = !m.isOpen;
        this.setState({
            modalState: m
        })
    }

    //---------------------------GET RENDERED

    render() {
        let { className, actionButtons, gridSize, settings, isEditing} = this.props;
        //var for detecting div size
        let isSmall = gridSize && gridSize.width < 4;

        //get the scalar, if it has been loaded
        let s = settings["scalars.reference"];
        if (!s) {
            s = {
                "id": null,
                "name": "new_scalar",
                "description": null,
                "value": null,
                "date": null
            }
        }
        const scalar = s;

        const { id, name, value, description } = scalar;

        //force rendering of individual modals per scalar
        const scalarModal = this.state.modalState.isOpen ?
            (<ScalarForm
                isOpen={this.state.modalState.isOpen}
                onSubmit={this.saveupdatescalar.bind(this)}
                onClose={this.onModalOpenClick.bind(this)}
                initialValues={id ? scalar : {}}
            />)
            :
            null;


        return (
            <div className={cx(className, styles.Scalar, styles[isSmall ? "small" : "large"])}>
                {(isEditing) &&
                    <div>
                        { scalarModal }
                        <ScalarActionButtons
                            actionButtons={actionButtons}
                            modalState={this.state.modalState}
                            saveupdatescalar={this.saveupdatescalar.bind(this)}
                            onModalOpenClick={this.onModalOpenClick.bind(this)}
                            scalar={id !== null ? scalar : {}}
                        />
                    </div>
                }

                <Ellipsified
                    className={cx(styles.Value, 'ScalarValue text-dark fullscreen-normal-text fullscreen-night-text', {
                        "text-brand-hover cursor-pointer": true
                    })}
                    tooltip={description ? description : "Select the `+` on the left hand side of the card!"}
                    alwaysShowTooltip={name ? name !== description : true}
                    style={{maxWidth: '100%'}}
                >
                      <span
                          onClick={() => {}
                              //TODO: funkeyfreak - handle the opening of a modal on the click of the scalar object
                              //this._scalars ? this.onModalOpenClick(scalar): (() => {/*do nothing*/})
                          }


                          //ref={scalars => this._scalars = scalars}
                      >
                         {value ? value : "0"}
                      </span>
                </Ellipsified>

                <div className={styles.Title + " flex align-center relative"}>
                    <Ellipsified
                        tooltip={name ? name : ""}>
                      <span
                          className={"fullscreen-normal-text fullscreen-night-text"}
                      >
                          <span className="Scalar-title">
                              {name ? name : ""}
                          </span>
                      </span>

                    </Ellipsified>
                    { description &&
                    <div
                        className="absolute top bottom hover-child flex align-center justify-center"
                        style={{ right: -20, top: 2 }}
                    >
                        <Tooltip tooltip={description} maxWidth={'22em'}>
                            <Icon name='infooutlined' />
                        </Tooltip>
                    </div>
                    }
                </div>
            </div>

        );
    }

}

//TODO: funkeyfreak - move to ../components/ScalarActopmButtons.jsx
const ScalarActionButtons = ({ actionButtons, onModalOpenClick, saveupdatescalar, modalState, scalar}) => (
    <div className="Card-title">
        <div className="absolute top left p1 px2">
            <span className="DashCard-actions-persistent flex align-center" style={{ lineHeight: 1 }}>
                <a
                    data-metabase-event={scalar && scalar.id && scalar.id !== 0 ? "Dashboard;Scalar;edit" : "Dashboard;Scalar;add"}
                    className={" cursor-pointer h3 flex-no-shrink relative mr1 text-brand" }
                    onClick={onModalOpenClick}
                    style={HEADER_ACTION_STYLE}
                >
                    <span className="flex align-center">
                        <span className="flex">
                            {(scalar && scalar.id)
                                ?
                                <Icon name="editdocument" style={{ top: 0, left: 0 }} size={HEADER_ICON_SIZE} />
                                :
                                <Icon name="add" style={{ top: 0, left: 0 }} size={HEADER_ICON_SIZE} />
                            }
                        </span>
                    </span>
                </a>


            </span>
        </div>
        <div className="absolute top right p1 px2">{actionButtons}</div>
    </div>
);

export default connect(mapStateToProps, mapDispatchToProps)(Scalars)
