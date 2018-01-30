/* @flow */

import React, { Component } from "react";
import { t } from 'c-3po';
import moment from 'moment';

import renderDatePicker from "./RenderDatePicker"

///import Select from 'react-select';

import Button from "metabase/components/Button";
import FormField from "metabase/components/FormField";
import Input from "metabase/components/Input";
import Modal from "metabase/components/Modal";
import DatePicker from 'react-datepicker'

import { reduxForm, Field} from "redux-form";


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
    initialValues: {
        name: "",
        date: moment().format("MM/DD/YYYY"),
        description: ""
    }
};

export const getFormTitle = ({ id, name }) =>
    id.value ? name.value : t`New Scalar`

export const getActionText = ({ id }) => {
    console.log(id);
    id.value ? t`Update` : t`Create`
}

export const ScalarEditorFormActions = ({ handleSubmit, invalid, onClose, fields}) =>
    <div>
        <Button className="mr1" onClick={onClose}>
            Cancel
        </Button>
        <Button primary disabled={invalid} onClick={handleSubmit}>
            { getActionText(fields) }
        </Button>
    </div>

const ReduxFormDateRange = (props) => {
    return (
        <DatePicker
            selected={props.input.value || null}
            onChange={props.input.onChange}
        />
    )
}

export class ScalarForm extends Component {
    props: {
        fields: Object,
        onClose: Function,
        invalid: Boolean,
        isOpen: boolean,
        handleSubmit: Function,
    };

    static defaultProps ={
        isOpen: false,
        className: "Modal",
        backdropClassName: "Modal-backdrop"
    };

    render() {
        const { fields, onClose } = this.props;
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
                            className="Form-input full"
                            placeholder={t`My new fantastic number`}
                            autoFocus
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
                            {...fields.value}
                        />
                    </FormField>
                    <FormField
                        displayName={t`Description`}
                        {...fields.description}
                    >
                        <textarea
                            readOnly={!!fields.description}
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
                            {...fields.date}
                        />
                    </FormField>

                </div>
            </Modal>
        )
    }
}


ScalarForm.defaultProps = {
    isOpen: false
};


export default reduxForm(formConfig)(ScalarForm)

