import React, { Component } from "react";
import { t } from 'c-3po';
import Button from "metabase/componets/Button.jsx";
import ModalContent from "metabase/components/ModalContent.jsx";
import Icon from "metabase/components/Icon.jsx";
import HeaderWithBack from "metabase/components/HeaderWithBack.jsx";

import ScalarsList from "../components/ScalarsList";
//TODO: funkeyfreak - Get expanding searchfield to work
//import ExpandingSearthField from "../components/"


export default class ScalarsModal extends Component {
    state = {
        scalar: null,
        query: null
    }

    renderScalarList = () => {
        return (
          <ScalarsList

          />
        );
    }
}
