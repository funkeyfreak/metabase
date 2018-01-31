/* @flow */

import React, { Component } from "react";
import { t } from 'c-3po';
import moment from 'moment';

//TODO: from [dalinwilliams on 1/31/18 @ 10:27 AM]: Add date picker and key selecor for available keys and better date-time selection
//import renderDatePicker from "./RenderDatePicker"
//import Select from 'react-select';
//import DatePicker from 'react-datepicker'

import Button from "metabase/components/Button";
import FormField from "metabase/components/FormField";
import Input from "metabase/components/Input";
import Modal from "metabase/components/Modal";

import { reduxForm } from "redux-form";

import 'react-datepicker/dist/react-datepicker.css';


const formConfig = {
    form: 'scalar',
    fields: ['id', 'name', 'value', 'date', 'description'],
    validate: (values) => {
        const errors = {};
        if (!values.name) {
            errors.name = t`Name is required`;
        } else if (values.name.length > 100) {
            errors.name = t`Name must be 100 characters or less`;
        }
        if (!values.value) {
            errors.value = t`Value is required`;
        } else if (isNaN(values.value)){
            errors.value = t`Invalid Value Entered`
        }
        if (!values.date) {
            errors.date = t`Date is required`;
        }
        let date = moment(values.date);
        if (!date.isValid() && moment(values.date, "MM/DD/YYYY").format("MM/DD/YYYY") !== values.date){
            errors.date = t`Invalid date, please enter in a valid date`
        }
        return errors;
    },
    enableReinitialize: true,
    initialValues: {
        name: "",
        description: "",
        date: moment().format("MM/DD/YYYY")
    }
};

export const getFormTitle = ({ id, name }) =>
    id.value ? name.value : t`New Scalar`

export const getActionText = ({ id }) =>
    id.value ? t`Update` : t`Create`


export const ScalarEditorFormActions = ({ handleSubmit, invalid, onClose, fields}) =>
    <div>
        <Button className="mr1" onClick={onClose}>
            Cancel
        </Button>
        <Button primary disabled={invalid} onClick={handleSubmit}>
            { getActionText(fields) }
        </Button>
    </div>

/*TODO: from [dalinwilliams on 1/31/18 @ 10:28 AM]: Unused datepicker - for improvements
const ReduxFormDateRange = (props) => {
    return (
        <DatePicker
            selected={props.input.value || null}
            onChange={props.input.onChange}
        />
    )
}
*/
export class ScalarForm extends Component {
    props: {
        fields: Object,
        onClose: Function,
        invalid: Boolean,
        handleSubmit: Function,
    };

    static defaultProps ={
        isOpen: false,
        className: "Modal",
        backdropClassName: "Modal-backdrop",
    };
    constructor(props){
        super(props);
        console.debug(props);
    }

    render() {
        const { fields, onClose, initialValues } = this.props;
        return (
            <Modal
                full={false}
                inline={true}
                form
                title={getFormTitle(fields)}
                footer={<ScalarEditorFormActions {...this.props} />}
                onClose={onClose}
                {...this.props}
            >
                <div className="NewForm ml-auto mr-auto mt4 pt2" style={{ width: 540 }}>
                    <FormField
                        displayName={t`Name`}
                        {...fields.name}
                    >
                        <Input
                            readOnly={initialValues.name != ""}
                            className="Form-input full"
                            placeholder={t`My new fantastic number`}
                            autoFocus
                            value={initialValues.name}
                            {...fields.name}
                        />
                    </FormField>
                    <FormField
                        displayName={t`Value`}
                        {...fields.value}
                    >
                        <textarea
                            className="Form-input full"
                            placeholder={t`Your integer value!`}
                            value={initialValues.value}
                            {...fields.value}
                        />
                    </FormField>
                    <FormField
                        displayName={t`Description`}
                        {...fields.description}
                    >
                        <textarea
                            readOnly={initialValues.description != ""}
                            value={initialValues.description}
                            className="Form-input full"
                            placeholder={t`It's optional but oh, so helpful`}

                            {...fields.description}
                        />
                    </FormField>
                    <FormField
                        displayName={t`Date`}
                        {...fields.date}
                        >
                        <textarea
                            className="Form-input full"
                            placeholder={moment().format("MM/DD/YYYY")}
                            value={initialValues.date}
                            {...fields.date}
                        />
                    </FormField>

                </div>
            </Modal>
        )
    }
}


ScalarForm.defaultProps = {
    isOpen: false,
    initialValues: {},
    enableReinitialize: true
};


export default reduxForm(formConfig)(ScalarForm)

