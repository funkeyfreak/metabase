import React, { Component } from "react";
import { t } from 'c-3po';
import moment from 'moment';

import DatePicker from 'react-datepicker';
import Select from 'react-select';

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
        } else if (values.value === Number.MIN_SAFE_INTEGER || values.value === Number.MAX_SAFE_INTEGER){
            errors.value = t`Invalid Value Entered`
        }
        if (!values.date) {
            errors.date = t`Date is required`;
        } let date = moment(values.date);
        if (!date.isValid()){
            errors.date = t`Invalid date, please enter in a valid date`
        }
        return errors;
    },
    initialValues: {
        name: "",
        value: Number.MIN_SAFE_INTEGER,
        date: moment.now(),
        description: ""
    }
};

export const getFormTitle = ({ id, name }) =>
    id.value ? name.value : t`New Scalar`

export const getActionText = ({ id }) =>
    id.value ? t`Update`: t`Create`


export const ScalarEditorFormActions = ({ handleSubmit, invalid, onClose, fields}) =>
    <div>
        <Button className="mr1" onClick={onClose}>
            Cancel
        </Button>
        <Button primary disabled={invalid} onClick={handleSubmit}>
            { getActionText(fields) }
        </Button>
    </div>

export class ScalarEditorForm extends Component {
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
                //form
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
                            placeholder={t`Some integer value`}
                            {...fields.value}
                        />
                    </FormField>
                    <FormField
                        displayName={t`Description`}
                        {...fields.description}
                    >
                        <textarea
                            className="Form-input full"
                            placeholder={t`It's optional but oh, so helpful`}
                            {...fields.description}
                        />
                    </FormField>
                    <FormField
                        displayName={t`Date`}
                        {...fields.date}
                    >
                        <DatePicker
                            selected={this.state.startDate}
                            placeholderText={moment()}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={15}
                            dateFormat="LLL"
                            todayButton={"Select Today"}
                            {...fields.date}
                        />
                    </FormField>
                </div>
            </Modal>
        )
    }
}


ScalarEditorForm.defaultProps = {
    isOpen: false
};


export default reduxForm(formConfig)(ScalarEditorForm)

