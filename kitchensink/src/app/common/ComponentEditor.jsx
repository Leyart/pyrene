import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import '../../css/componentPage.css';
import CodeBlock from '../common/CodeBlock';
import DynamicPropTable from './PageElements/Tables/DynamicPropTable';
import Paragraph from './PageElements/Paragraph/Paragraph';
import ExampleBox from './PageElements/ExampleBox/ExampleBox';
import examplesData from '../data/examplesData';
import specialComponentHandlingData from '../data/specialComponentHandlingData';

import ParentButton from './PageElements/ParentButton/ParentButton';

export default class ComponentEditor extends React.Component {

  handleComponentInteraction = (event) => {
    const newValue = this.getValueFromInput(event.target);
    this.setState((prevState, props) => ({
      componentProps: { ...prevState.componentProps, value: newValue },
    }));
  };

  state = {
    componentState: {},
    componentProps: {...this.props.component.defaultProps },
    pinned: false, //console change this back to true
    darkMode: false,
  };


  handlePinClick = () => {
    this.setState((prevState, props) => ({
      pinned: !prevState.pinned,
    }));
  };

  handleSunClick = () => {
    this.setState((prevState, props) => ({
      darkMode: !prevState.darkMode,
    }));
  };

  handleExampleClick = (exampleProps) => {
    this.setState(() => ({
      componentProps: { ...this.props.component.defaultProps, ...exampleProps, onChange: this.handleComponentInteraction },
    }));
  };

  getValueFromInput = (target) => {
    switch (target.type) {
      case 'checkbox':
        return target.checked;
      case 'singleSelect':
        if (target.value == null) {
          return null;
        }
        return target.value.label;
      default:
        return target.value;
    }
  };

  handleEditorChange = (event) => {
    const inputName = event.target.name;
    const newValue = this.getValueFromInput(event.target);
    const changedProp = { [inputName]: newValue };

    this.setState((prevState, props) => ({
      componentProps: { ...prevState.componentProps, ...changedProp },
    }));
  };

  initField = (fieldName) => {
    return ({
      name: fieldName,
      value: this.state.componentProps[fieldName],
      onChange: this.handleEditorChange,
    });
  };

  setComponentState = (newState) => {
    this.setState((prevState) => ({
      ...prevState,
      componentState: {
        ...prevState.componentState,
        ...newState,
      },
    }));
  };

  getComponentState = () => {
    const { startProps } = this.props;
    const { componentState } = this.state;
    if (typeof startProps === "function") {
      return startProps({ state: componentState, setState: this.setComponentState });
    }
    return startProps;
  };

  getComponentName = (component) => {
    return component.displayName.toLowerCase().replace(/\s/g, '');
  };

  render() {
    const componentProps = {...this.state.componentProps, ...this.getComponentState()};
    const displayedComponent = <this.props.component {...componentProps} />;
    return (
      <div className={'componentPlayground'}>
        {examplesData[this.getComponentName(this.props.component)] &&
        <Paragraph title={'Examples'}>
          <ExampleBox component={this.props.component} onExampleClick={this.handleExampleClick}/>
        </Paragraph>
        }
        <Paragraph title={'Props'}>
          <div styleName={classNames('displayContainer', { pinned: this.state.pinned }, { darkMode: this.state.darkMode })}>
            <div styleName={classNames('pin', { pinned: this.state.pinned })} onClick={() => this.handlePinClick()} />
            <div styleName={classNames('sun', { darkMode: this.state.darkMode })} onClick={() =>this.handleSunClick()} />
            <div styleName={'componentDisplay'}>
              {specialComponentHandlingData[this.getComponentName(this.props.component)] && specialComponentHandlingData[this.getComponentName(this.props.component)].needsTrigger ? <ParentButton component={displayedComponent} /> : displayedComponent}
            </div>
            <CodeBlock component={displayedComponent} displayComponentPinned={this.state.pinned} />
          </div>
          <DynamicPropTable
            propDocumentation={this.props.component.__docgenInfo.props}
            initField={this.initField}
          />
        </Paragraph>
      </div>
    );
  }

}


ComponentEditor.displayName = 'ComponentEditor';

ComponentEditor.propTypes = {
  component: PropTypes.func.isRequired,
  startProps: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
};

ComponentEditor.defaultProps = {};

