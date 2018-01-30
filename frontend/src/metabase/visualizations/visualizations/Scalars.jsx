/*@flow*/
import React, { Component } from "react";
import { connect } from 'react-redux';
import ReactMarkdown from "react-markdown";
import cx from "classnames";


import moment from 'moment';
import Tooltip from "metabase/components/Tooltip";
import ScalarForm from "../components/ScalarForm";
//import ScalarFormRenderer from "../components/ScalarFormRender";
import Icon from "metabase/components/Icon.jsx";
import Ellipsified from "metabase/components/Ellipsified.jsx";

import 'react-datepicker/dist/react-datepicker.css';
import styles from "./Scalars.css";

//import dashboard from "metabase/dashboard/dashboard"
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

/*export type ScalarSettings = {
    SCALAR: number,
    DisplayProps: DisProps
};*/

export type Scalar = {
    id: number,
    name: string,
    description: string,
    value: number,
    date: string,
};

type State = {
    scalarDiff: number,
    scalarBase: number,
    text: string,
    newScalarName: string,
    //uniqueKeys: [string],
    modalState: {
        isOpen: boolean,
        save: boolean
    },
    reference: Scalar
};

//const ArrOfScalar = [Scalar];

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

export class Scalars extends Component {
    props: VisualizationProps;
    state: State;

    constructor(props: VisualizationProps){
        //TODO: funkeyfreak - bind all the functions => https://stackoverflow.com/questions/44406599/calling-a-function-from-another-in-reactjs
        super(props);

        this.state = {
            scalarKey: "",
            scalarDiff: 0,
            scalarBase: 0,
            text: "",
            uniqueKeys: [],
            modalState: {
                isOpen: false,
                save: false
            },
            /*scalar: {
                id: 0,
                name: "",
                description: "",
                value: 0,
                date: ""
            }*/
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
    //_renderedText: ?HTMLElement; //TODO: funkeyfreak -  fixthis



    static scalarStats = {};
    //default modal state
    static modalState = {
        isOpen: false,
        save: false
    };

    static Scalar = {
        id: 0,
        name: "",
        description: "",
        value: 0,
        date: ""
    };

    //default form state
    static formState = {
        newScalarName: "",
        newScalarNameWarnLong: false,
        newScalarValue: 0.0,
        newScalarValueWarnNeg: false,
        newScalarDate: moment() //set the new scalar date to default to now
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
            /*"id": null,
            "name": null,
            "description": null,
            "value": null,
            "date": ""*/
        },
        //I could add blank objects....
        "scalars.DisplayProperties": { //TODO: funkeyfreak - rename to scalar.DisplayProperties
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
        console.debug("Mounting Scalar...");
        //load all the scalars
        this.props.getScalars();
        if(!this.props.settings){
            //this.props.onUpdateVisualizationSettings( "scalars.reference": {});
        }
    }

    componentDidMount(){
        console.debug("Scalar obj");
        //console.debug(this.props.scalar);
        //load those settings bois
        if (this.props.settings) {
            let id = this.props.settings["scalars.SCALAR"];
            let scalar = this.props.settings["scalars.reference"];
            let dispProps = this.props.settings["scalars.DisplayProperties"];

            //fetch what needs to be fetched
            if (scalar && scalar != null && id && id != null) {
                let {ids, key} = scalar;
                if (id == ids) { // double to allow for string comp
                    this.props.getScalar(id);
                    if (dispProps.rangeType.date) {
                        //fetchKeyDateScalar already accepts a object with start and end!
                        this.props.fetchKeyDateScalar(key, dispProps.rangeType.date)
                    } else if (dispProps.rangeType.count) {
                        //TODO: funekyfreak - this would be awesome to have
                    }
                } else {
                    console.debug("Keys given do not match, id: " + id + " ids: " + ids);
                }
            }
        }
    }

    componentWillUpdate(){
        console.debug("here - should fire off after any state change and prop change");
        //console.debug(this.state);
    }

    componentWillReceiveProps(newProps: VisualizationProps) {
        console.debug("we be getting da props")
        //console.debug(newProps);
        //if we are editing the dashboard
        if(!this.props.isEditing && newProps.isEditing) {
            //Do stuff
        }

        //update the visuals for rendering
        if (!this.props.isEditing && !newProps.isEditing){
            //this.updateCardState(this.props.settings);
        }
        if(newProps.scalar != null){
            //this bit is a bit greedy...
            let scalar = newProps.scalar;
            let { id, value } = scalar;
            let scalars = newProps.scalarList;
            if( scalars != null) {
                //always update the stats!
                //const stats = new Stats(scalars);
                //this.settings["stats"] = stats.normal(value);
                //this.scalarStats = stats;
            }
            //update the settings, if they are dirty
            if(newProps.settings.dirty){
                console.debug("EWW, settings are dirty - lets change that");
                this.props.onUpdateVisualizationSettings({"dirty": false, "scalars.SCALAR": id, "scalars.reference": scalar});
            }
        }

        this.setState({

        });
    }
    componentDidUpdate(){
        //TODO: funkeyfreak - this is where we can refresh the scalar via the scalar api after user entry via a form
    }



    //---------------------------ACTIONS



    onScalarClicked (){

    }

    onModalOpenClick(){
        let m = this.state.modalState;
        m.isOpen = !m.isOpen;
        this.setState({
            modalState: m
        })
    }

    //---------------------------GET RENDERED SONNNN
    render() {
        let { className, actionButtons, gridSize, settings, isEditing} = this.props;
        //var for detecting div size
        let isSmall = gridSize && gridSize.width < 4;

        //get the scalar, if it has been loaded
        let s = settings["scalars.reference"];
        if (!s) {
            //console.debug("SHIT");
            s = {
                "id": null,
                "name": "new_scalar",
                "description": null,
                "value": null,
                "date": null
            }
        }
        const scalar = s;
        //let scalar = settings["scalars.reference"];

        const { id, name, value, description } = scalar;
        //console.debug(scalar);
        //name = "sales";
        //value = "what nw?!";
        //description = "after the dddd";
        return (
            <div className={cx(className, styles.Scalar, styles[isSmall ? "small" : "large"])}>
                {(isEditing) &&
                    <div>


                        <ScalarActionButtons
                            actionButtons={actionButtons}
                            modalState={this.state.modalState}
                            //scalar={this.settings["scalars.reference"]}
                            //onEdit={this.onEdit.bind(this)}
                            saveupdatescalar={this.saveupdatescalar.bind(this)}
                            onModalOpenClick={this.onModalOpenClick.bind(this)}
                            //scalar={this.settings && this.settings["scalars.reference"] ? this.settings["scalars.reference"] : {}}//{this.props.scalar}
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
                              //this._scalars ? this.onModalOpenClick(scalar): (() => {/*do nothing*/})
                          }
                          //ref={scalars => this._scalars = scalars}
                      >
                         {value ? value : "0"}
                      </span>
                </Ellipsified>

                <ReactMarkdown
                    //className={cx("full flex-full flex flex-column text-card-markdown", styles["text-card-markdown"])}
                    style={{ display: "none"}}//hide md renderer
                    //source={settings.text}
                    //ref={renderedMD => this._renderedText = renderedMD}
                />
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
    <div className="Card-title">{console.debug(modalState)}
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
        <ScalarForm
            isOpen={modalState.isOpen}
            //fields={Object.values(this.props.scalar)}
            //fields={this.props.settings && this.props.settings["scalars.reference"] ? Object.values(this.props.settings["scalars.reference"]).map(r => String(r)) : ["", "", "", "", moment().format()]}
            onSubmit={saveupdatescalar}
            onClose={onModalOpenClick}//{this.onModalOpenClick.bind(this)}
            //initialState={this.props.settings && this.props.settings["scalars.reference"] ? Object.values(this.props.settings["scalars.reference"]).map(r => String(r)) : ["", "", "", "", moment().format()]}
            //initialValues={this.props.settings && this.props.settings["scalars.reference"] ? Object.values(this.props.settings["scalars.reference"]).map(r => String(r)) : ["", "", "", "", moment().format()]}
            //{...this.props}
            //initialValues={this.settings && this.settings["scalars.reference"] && this.props.settings && this.props.settings["scalars.reference"] ? this.props.settings["scalars.reference"] : { date: moment().format("MM/DD/YYYY")}}
            enableReinitialize={true}
            //initialValues={settings["scalars.reference"] ? settings["scalars.reference"] : {}}
            initialValues={scalar}

        />
    </div>
);

export default connect(mapStateToProps, mapDispatchToProps)(Scalars)
