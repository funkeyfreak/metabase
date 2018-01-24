/*@flow*/
import React, { Component } from "react";
import { connect } from "react-redux";
import ReactMarkdown from "react-markdown";
import { t } from 'c-3po';
import cx from "classnames";

import d3 from "d3";

import moment from 'moment';
import Tooltip from "metabase/components/Tooltip";
import ScalarForm from "../components/ScalarForm";
import Button from "metabase/components/Button";
import ColorPicker from "metabase/components/ColorPicker";
import FormField from "metabase/components/FormField";
import Input from "metabase/components/Input";
import Modal from "metabase/components/Modal";
import Icon from "metabase/components/Icon.jsx";
import Ellipsified from "metabase/components/Ellipsified.jsx";
import { formatValue } from "metabase/lib/formatting";
import { isNumber } from "metabase/lib/schema_metadata";

import 'react-datepicker/dist/react-datepicker.css';
import styles from "./Scalars.css";

import { getKeyScalar, getScalar, fetchScalars, saveScalar, fetchKeyDateScalar, deleteScalar }  from "metabase/dashboard/dashboard"


//TODO: funkeyfreak - need to import ChartSettingSelect inorder to make date filterable

import type { VisualizationProps } from "metabase/meta/types/Visualization";

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

export type ScalarSettings = {
    SCALAR: number,
    DisplayProps: DisProps
};

export type Scalar = {
    id: number,
    name: string,
    description: string,
    value: number,
    date: moment,
};

type State = {
    isShowingRenderedOutput: boolean,
    displaySettings: DisProps,
    scalarDiff: number,
    scalarBase: number,
    scalarValues: [Scalar],
    scalarRange: [Scalar],
    text: string,
    newScalarName: string,
    uniqueKeys: [string],
    formState: {
        newScalarName: string,
        newScalarNameWarnLong: boolean,
        newScalarValue: number,
        newScalarValueWarnNeg: boolean,
        newScalarDate: moment
    },
    modalState: {
        isOpen: boolean,
        save: boolean
    },
    Scalar: Scalar
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

export default class Scalars extends Component {
    props: VisualizationProps;
    state: State;

    constructor(props: VisualizationProps){
        //TODO: funkeyfreak - bind all the functions => https://stackoverflow.com/questions/44406599/calling-a-function-from-another-in-reactjs
        super(props);

        this.state = {
            isShowingRenderedOutput: false,
            displayProperties: {
                rangeType: {
                    date: null,
                    count: 0
                },
                visType: "##",
                maths:   "selected"
            },
            scalarKey: "",
            scalarDiff: 0,
            scalarBase: 0,
            scalarValues: {},
            scalarRange: {},
            text: "",
            uniqueKeys: [],
            formState: {
                newScalarName: "",
                newScalarNameWarnLong: false,
                newScalarValue: 0.0,
                newScalarValueWarnNeg: false,
                newScalarDate: moment() //set the new scalar date to default to now
            },
            modalState: {
                isOpen: false,
                save: false
            },
            Scalar: {
                id: 0,
                name: "",
                description: "",
                value: 0,
                date: moment()
            }
        };
    }

    static uiName = t`Scalars`;
    static identified = "scalars";
    static iconName = "scalars";

    static disableSettingsConfig = true;
    static noHeader = true;
    static supportsSeries = false;
    static hidden = true;

    static minSize = { width: 3, height: 3 };

    //reference the rendered text
    _renderedText: ?HTMLElement;

    static checkRenderable() {
        // TODO: funkeyfreak - you may need to refresh the scalar API query before this happens
    }
    //default modal state
    static modalState = {
        isOpen: false,
        save: false
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
        maths:   "current",
    };

    //Settings structure
    static settings = {
        "SCALAR": {
            value: 0,
            default: 0
        },
        //I could add blank objects....
        "DisplayProperties": {
            /*value: {
                rangeType: {
                    date: null,
                    count: 0
                },
                visType: "",
                maths:   ""
            },
            default: {
                rangeType: {
                    date: null,
                    count: 0
                },
                visType: "",
                maths:   ""
            }*/
        }

    };

    //-------------- STATIC FUNCTIONS
    static reFetch(name, daterange = {start: Date, end: Date}){
        this.setState({
            isShowingRenderedOutput: false,
            //arrOfScalar: fetchScalars()
        });
        if (name == null){
            this.setState({
                arrOfScalar: fetchScalars()
            });
        }
        else if(daterange == null || daterange.start == null){
            this.setState({
                scalarValues: fetchKeyDateScalar(name)
            });
        } else {
            this.setState({
                scalarValues: fetchKeyDateScalar(name, daterange)
            });
        }
    }

    updateCardState(){
        let { SCALAR, DisplayProps } = this.settings;
        let { date, count } = DisplayProps.rangeType;
        let scalars, loaded, keyBind, rangeBind, scalarsToState;

        //Loads all the scalars AND the keys of the selected
        try {
            scalars = fetchScalars();
            scalarsToState = scalars;
        } catch(e){

        } finally{

        }

        //get the unique key if we're populating from an existing card and set the range
        loaded = Scalar;
        keyBind = [Scalar];
        rangeBind = [Scalar];
        if(SCALAR && SCALAR !== 0) {
            try{
                loaded = getScalar({id: SCALAR});
            } catch(e){

            } finally {

            }
            try {
                let {id, key} = loaded;
                if (id && key && id !== 0 && key !== "") {
                    keyBind = fetchKeyDateScalar({key: key, date: date})
                }
                let len = keyBind.length();
                if(len !== 0){
                    scalarsToState = keyBind;
                }
                if(count < len){
                    let start = (count-len) - 1,
                        end   = count - 1;
                    rangeBind = keyBind.slice(start, end);
                }
            } catch(e) {

            } finally {

            }
        }
        //select all the unique keys
        const unique = [...new Set(scalars.map(scalars => scalars.name))];


        this.setState({
            scalarValues: scalarsToState,
            scalarRange: rangeBind,
            uniqueKeys: unique,
            displayProperties: DisplayProps,
            Scalar: loaded
        });
    }

    saveupdatescalar(scalar){
        //if the modals form has new values, save and return the latest OR whatever visualization has been saved
        //let { save } = this.state.modalState;
        //if (save) {
        //let {newScalarName, newScalarValue, newScalarDate} = this.scalar;
        //this.state.formState;
        //if (newScalarName !== this.formState.newScalarName && newScalarValue !== this.formState.newScalarValue) {
        //let newScalar = Scalar;
        //newScalar.name = newScalarName;
        //newScalar.value = newScalarValue;
        //newScalar.date = newScalarDate;
        //TODO: funkeyfreak - This might work AND be a lot cleaner..
        //let t = Scalar({name: newScalarName, value: newScalarValue, date: newScalarDate});
        let newScalar = scalar;

        //create scalar obj and save
        let response, message, successful;
        message = "Scalar Saved!";
        successful = true;
        try {
            response = saveScalar(newScalar)
        } catch (e) {
            message = e;
        } finally{
            //Debug
            console.log(message);
        }
        if(!successful){
            //TODO: funkeyfreak - handle error from saveScalar
        } else{
            //update the props, which will update the settings as well
            this.props.onUpdateVisualizationSettings({ "SCALAR": response.id })
        }
        //TODO: funkeyfreak - send to vis framework
        //}
        //}
    }



    //-------------- REACT NATIVE FUNCTIONS
    componentDidMount(){
        this.updateCardState(this.props.settings);
        /*let { SCALAR, DisplayProps } = this.settings;
        let { date, count } = DisplayProps.rangeType;
        let scalars, loaded, keyBind, rangeBind, scalarsToState;

        //Loads all the scalars AND the keys of the selected
        try {
            scalars = fetchScalars();
            scalarsToState = scalars;
        } catch(e){

        } finally{

        }

        //get the unique key if we're populating from an existing card and set the range
        loaded = Scalar;
        keyBind = [Scalar];
        rangeBind = [Scalar];
        if(SCALAR && SCALAR !== 0) {
            try{
                loaded = getScalar({id: SCALAR});
            } catch(e){

            } finally {

            }
            try {
                let {id, key} = loaded;
                if (id && key && id !== 0 && key !== "") {
                    keyBind = fetchKeyDateScalar({key: key, date: date})
                }
                let len = keyBind.length();
                if(len !== 0){
                    scalarsToState = keyBind;
                }
                if(count < len){
                    let start = (count-len) - 1,
                        end   = count - 1;
                    rangeBind = keyBind.slice(start, end);
                }
            } catch(e) {

            } finally {

            }
        }
        //select all the unique keys
        const unique = [...new Set(scalars.map(scalars => scalars.name))];


        this.setState({
            scalarValues: scalarsToState,
            scalarRange: rangeBind,
            uniqueKeys: unique,
            displayProperties: DisplayProps,
            Scalar: loaded
        });*/

    }

    componentWillReceiveProps(newProps: VisualizationProps) {
        //if we are editing the dashboard
        if(!this.props.isEditing && newProps.isEditing) {
            this.onEdit();
        }
        //check to see if id has been updated
        //let settings = this.props.settings;
        //let newSettings = newProps.settings;
        //if(settings.SCALAR !== newSettings.SCALAR){
        //}
        //update the visuals for rendering
        if (!this.props.isEditing && !newProps.isEditing){
            this.updateCardState(this.props.settings);
        }
    }
    componentDidUpdate(){
        //TODO: funkeyfreak - this is where we can refresh the scalar via the scalar api after user entry via a form
    }
    //---------------------------HANDLERS

    handleTextChange(text: string){
        //this.props.onUpdateVisualizationSettings({"scalar_text": text})
    }

    /*handleFormChange(event){
        let target = event.target;
        let value = target.value;
        let name = target.name;
        let s = {...this.state.formState};
        //set saved if both are changed && change respective vars
        s[name] = value;
        this.setState({
            formState: s
        });
        //if both are good to go, we want to save!
        if(this.state.formState.newScalarValue !== this.formState.newScalarValue && this.state.formState.newScalarName !== this.formState.newScalarName){
            //tmp modal state
            let m = this.state.modalState;
            m.save = true;
            //and save
            this.saveState({
                modalState: m
            });
        }
        //update warnings
        if(this.state.formState.newScalarName.length() > 20){
            s.newScalarNameWarnLong = true;
            this.setState({
                formState: s
            });
        }
        if(this.state.formState.newScalarValue <= 0){
            s.newScalarValueWarnNeg = true;
            this.setState({
                formState: s
            })
        }
    }

    handleDatePickerChange(date){
        this.setState({
            newScalarDate: date
        });
    }*/

    //---------------------------ACTIONS

    //clear everything JUST in-case it is not set
    onScalarModalOpen(event){
        let f = {...this.state.formState};
        let m = {...this.state.modalState};

        f = this.formState;
        m = this.modalState;

        this.setState({
            formState: f,
            modalState: m
        });
    }

    onEdit() {
        this.setState({ isShowingRenderedOutput: false });
    }

    onPreview() {
        this.setState({ isShowingRenderedOutput: true });
    }

    onScalarClicked (){

    }

    onOpenModal(scalar : Scalar){
        let m = this.state.modalState;
        m.isOpen = !m.isOpen;
        this.setState({
            modalState: m
        })
    }


    render() {
        let { className, actionButtons, gridSize, settings, isEditing} = this.props;
        // var for detecting div size
        let isSmall = gridSize && gridSize.width < 4;

        let scalar = settings["scalars.reference"];
        let { id, name, value, description, date } = scalar;


        if (isEditing) {
            return (
                <div className={cx(className, styles.Scalars, styles[isSmall ? "small" : "large"], styles["dashboard-is-editing"])}>
                    <ScalarForm
                        isOpen={this.state.modalState.isOpen}
                        fields={this.state.Scalar}
                        handleSubmit={this.saveupdatescalar()}
                        onClose={this.onOpenModal.bind(this)}
                    />
                    <ScalarActionButtons>
                        actionButtons={actionButtons}
                        modalState={this.state.modalState}
                        onEdit={this.onEdit.bind(this)}
                        onOpenModal={this.onOpenModal.bind(this)}
                    </ScalarActionButtons>

                {this.state.isShowingRenderedOutput ?
                    (<ReactMarkdown
                        className={cx("full flex-full flex flex-column text-card-markdown", styles["text-card-markdown"])}
                        source={settings.text}
                        ref={renderedMD => this._renderedText = renderedMD}
                    />)
                    :
                    (
                        <textarea
                            className={cx("full flex-full flex flex-column bg-grey-0 bordered drag-disabled", styles["text-card-textarea"])}
                            name="text"
                            placeholder="please"
                        />

                    )

                }
                </div>
            );
        } else {
            return (

                <div className={cx(className, styles.Scalar, styles[isSmall ? "small" : "large"])}>
                    <div className="Card-title absolute top right p1 px2">{actionButtons}</div>
                    <Ellipsified
                        className={cx(styles.Value, 'ScalarValue text-dark fullscreen-normal-text fullscreen-night-text', {
                            "text-brand-hover cursor-pointer": false
                        })}
                        tooltip={name ? name : ""}
                        alwaysShowTooltip={name !== description}
                        style={{maxWidth: '100%'}}
                    >
                        <span
                            onClick={this._scalars ? this.onOpenModal(): (() => {/*do nothing*/})}
                            ref={scalars => this._scalars = scalars}
                        >
                            <span className="Scalar-title">{this._renderedText ? this._renderedText.textContent : ""}</span>
                        </span>

                        {//this._renderedText.textContent ? this._renderedText.textContent : ""//
                            }
                    </Ellipsified>

                    <ReactMarkdown
                        //className={cx("full flex-full flex flex-column text-card-markdown", styles["text-card-markdown"])}
                        style={{ display: "none"}}//hide md renderer
                        source={settings.text}
                        ref={renderedMD => this._renderedText = renderedMD}
                    />
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
            );
        }
    }
}

//TODO: funkeyfreak - move to ../components/ScalarEntryItem.jsx
const ScalarEntryItem =  ({ stuff }) => <div>
</div>

//TODO: funkeyfreak - move to ../components/ScalarOptions.jsx
const ScalarOptions = ({ stuff }) => <div>
</div>

//TODO: RESOLVED funkeyfreak - move to ../components/ScalarForm.jsx
/*const ScalarForm = ({}) => <form>
    <label>
        Scalar Name:
        <input
            name="newScalarName"
            type="text"
            value={this.state.formState.newScalarName}
            onChange={this.handleFormChange}
            placeholder="Enter in a name for the scalar, or "
        />
    </label>
    <br />
    <label>
        Scalar Value:
        <input
            name="newScalarValue"
            type="number"
            value={this.state.formState.newScalarValue}
            onChange={this.handleFormChange}
            placeholder="Enter in a value for the new scalar"
        />
    </label>
    <br />
    <label>
        Scalar Date:

    </label>
</form>*/

//TODO: funkeyfreak - move to ../components/ScalarActopmButtons.jsx
const ScalarActionButtons = ({ actionButtons, isShowingRenderedOutput, onEdit, onModalOpen, scalar}) =>(
    <div className="Card-title">
        <div className="absolute top left p1 px2">
            <span className="DashCard-actions-persistent flex align-center" style={{ lineHeight: 1 }}>
                <a
                    data-metabase-event={scalar.id && scalar.id !== 0 ? "Dashboard;Scalar;edit" : "Dashboard;Scalar;add"}
                    className={" cursor-pointer h3 flex-no-shrink relative mr1 text-brand" }
                    onClick={onModalOpen(scalar)}
                    style={HEADER_ACTION_STYLE}
                >
                    <span className="flex align-center">
                        <span className="flex">
                            {scalar.id && scalar.id !== 0
                                ?
                                <Icon name="editdocument" style={{ top: 0, left: 0 }} size={HEADER_ICON_SIZE} />
                                :
                                <Icon name="document" style={{ top: 0, left: 0 }} size={HEADER_ICON_SIZE} />
                            }
                        </span>
                    </span>
                </a>


            </span>
        </div>
        <div className="absolute top right p1 px2">{actionButtons}</div>
    </div>
);
