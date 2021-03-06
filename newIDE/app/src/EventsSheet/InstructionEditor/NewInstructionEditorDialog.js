// @flow
import { Trans } from '@lingui/macro';

import * as React from 'react';
import Dialog from '../../UI/Dialog';
import FlatButton from '../../UI/FlatButton';
import {
  type ResourceSource,
  type ChooseResourceFunction,
} from '../../ResourcesList/ResourceSource.flow';
import { type ResourceExternalEditor } from '../../ResourcesList/ResourceExternalEditor.flow';
import InstructionParametersEditor from './InstructionParametersEditor';
import InstructionOrObjectSelector, {
  type TabName,
} from './InstructionOrObjectSelector';
import { Column } from '../../UI/Grid';
import InstructionOrExpressionSelector from './InstructionOrExpressionSelector';
import HelpButton from '../../UI/HelpButton';
import Background from '../../UI/Background';
import { type EventsScope } from '../EventsScope.flow';
import { SelectColumns } from '../../UI/Reponsive/SelectColumns';
import {
  ResponsiveWidthMeasurer,
  type WidthType,
} from '../../UI/Reponsive/ResponsiveWidthMeasurer';
import {
  useNewInstructionEditor,
  getInstructionMetadata,
} from './NewInstructionEditor';
import useForceUpdate from '../../Utils/UseForceUpdate';

const styles = {
  fullHeightSelector: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
};

type StepName =
  | 'object-or-free-instructions'
  | 'object-instructions'
  | 'parameters';

type Props = {|
  project: gdProject,
  scope: EventsScope,
  globalObjectsContainer: gdObjectsContainer,
  objectsContainer: gdObjectsContainer,
  instruction: gdInstruction,
  isCondition: boolean,
  resourceSources: Array<ResourceSource>,
  onChooseResource: ChooseResourceFunction,
  resourceExternalEditors: Array<ResourceExternalEditor>,
  style?: Object,
  isNewInstruction: boolean,
  onCancel: () => void,
  onSubmit: () => void,
  open: boolean,
  openInstructionOrExpression: (
    extension: gdPlatformExtension,
    type: string
  ) => void,
  anchorEl?: any, // Unused
|};

const getInitialStepName = (isNewInstruction: boolean): StepName => {
  if (isNewInstruction) return 'object-or-free-instructions';
  return 'parameters';
};

const getInitialTab = (
  isNewInstruction: boolean,
  hasObjectChosen: boolean
): TabName => {
  if (isNewInstruction) return 'objects';
  return hasObjectChosen ? 'objects' : 'free-instructions';
};

/**
 * A responsive instruction editor in a dialog, showing InstructionParametersEditor
 * at the end.
 */
export default function NewInstructionEditorDialog({
  project,
  globalObjectsContainer,
  objectsContainer,
  onCancel,
  open,
  instruction,
  isCondition,
  isNewInstruction,
  scope,
  onSubmit,
  resourceSources,
  onChooseResource,
  resourceExternalEditors,
  openInstructionOrExpression,
}: Props) {
  const forceUpdate = useForceUpdate();
  const [
    newInstructionEditorState,
    newInstructionEditorSetters,
  ] = useNewInstructionEditor({
    instruction,
    isCondition,
    project,
    isNewInstruction,
    scope,
    globalObjectsContainer,
    objectsContainer,
  });
  const {
    chosenObjectName,
    chosenObjectInstructionsInfo,
    chosenObjectInstructionsInfoTree,
  } = newInstructionEditorState;
  const {
    chooseFreeInstruction,
    chooseObject,
    chooseObjectInstruction,
  } = newInstructionEditorSetters;
  const hasObjectChosen =
    !!chosenObjectInstructionsInfo && !!chosenObjectInstructionsInfoTree;
  const [step, setStep] = React.useState(() =>
    getInitialStepName(isNewInstruction)
  );
  const [
    currentInstructionOrObjectSelectorTab,
    setCurrentInstructionOrObjectSelectorTab,
  ] = React.useState(() => getInitialTab(isNewInstruction, hasObjectChosen));
  const instructionType: string = instruction.getType();

  // Handle the back button
  const stepBackFrom = (origin: StepName, width: WidthType) => {
    if (origin === 'parameters' && chosenObjectName) {
      setStep(
        // "medium" displays 2 columns, so "Back" button should go back to the first screen.
        width === 'medium'
          ? 'object-or-free-instructions'
          : 'object-instructions'
      );
    } else {
      setStep('object-or-free-instructions');
    }
  };

  // Focus the parameters when showing them
  const instructionParametersEditor = React.useRef(
    (null: ?InstructionParametersEditor)
  );
  React.useEffect(
    () => {
      if (step === 'parameters') {
        if (instructionParametersEditor.current) {
          instructionParametersEditor.current.focus();
        }
      }
    },
    [step]
  );

  const instructionMetadata = getInstructionMetadata({
    instructionType,
    isCondition,
    project,
  });
  const instructionHelpPage = instructionMetadata
    ? instructionMetadata.getHelpPath()
    : undefined;

  const renderInstructionOrObjectSelector = () => (
    <Background noFullHeight key="instruction-or-object-selector">
      <InstructionOrObjectSelector
        style={styles.fullHeightSelector}
        project={project}
        currentTab={currentInstructionOrObjectSelectorTab}
        onChangeTab={setCurrentInstructionOrObjectSelectorTab}
        globalObjectsContainer={globalObjectsContainer}
        objectsContainer={objectsContainer}
        isCondition={isCondition}
        chosenInstructionType={!chosenObjectName ? instructionType : undefined}
        onChooseInstruction={(instructionType: string) => {
          chooseFreeInstruction(instructionType);
          setStep('parameters');
        }}
        chosenObjectName={chosenObjectName}
        onChooseObject={(chosenObjectName: string) => {
          chooseObject(chosenObjectName);
          setStep('object-instructions');
        }}
        focusOnMount={!instructionType}
        onSearchStartOrReset={forceUpdate}
      />
    </Background>
  );

  const renderParameters = () => (
    <Column expand justifyContent="center" key="parameters">
      <InstructionParametersEditor
        project={project}
        scope={scope}
        globalObjectsContainer={globalObjectsContainer}
        objectsContainer={objectsContainer}
        objectName={chosenObjectName}
        isCondition={isCondition}
        instruction={instruction}
        resourceSources={resourceSources}
        onChooseResource={onChooseResource}
        resourceExternalEditors={resourceExternalEditors}
        openInstructionOrExpression={openInstructionOrExpression}
        ref={instructionParametersEditor}
        focusOnMount={!!instructionType}
        noHelpButton
      />
    </Column>
  );

  const renderObjectInstructionSelector = () =>
    chosenObjectInstructionsInfoTree && chosenObjectInstructionsInfo ? (
      <InstructionOrExpressionSelector
        key="object-instruction-selector"
        style={styles.fullHeightSelector}
        instructionsInfo={chosenObjectInstructionsInfo}
        instructionsInfoTree={chosenObjectInstructionsInfoTree}
        iconSize={24}
        onChoose={(instructionType: string) => {
          chooseObjectInstruction(instructionType);
          setStep('parameters');
        }}
        selectedType={instructionType}
        useSubheaders
        focusOnMount={!instructionType}
        searchPlaceholderObjectName={chosenObjectName}
        searchPlaceholderIsCondition={isCondition}
      />
    ) : null;

  return (
    <ResponsiveWidthMeasurer>
      {width => (
        <Dialog
          actions={[
            <FlatButton
              label={<Trans>Cancel</Trans>}
              primary={false}
              onClick={onCancel}
              key="cancel"
            />,
            <FlatButton
              label={<Trans>Ok</Trans>}
              primary={true}
              keyboardFocused={false}
              disabled={!instructionType}
              onClick={onSubmit}
              key="ok"
            />,
          ]}
          secondaryActions={[
            width !== 'large' && step !== 'object-or-free-instructions' ? (
              <FlatButton
                label={<Trans>Back</Trans>}
                primary={false}
                onClick={() => stepBackFrom(step, width)}
                key="back"
              />
            ) : null,
            <HelpButton
              key="help"
              helpPagePath={instructionHelpPage || '/events'}
              label={
                !instructionHelpPage ||
                (width === 'small' ||
                  step === 'object-or-free-instructions') ? (
                  <Trans>Help</Trans>
                ) : isCondition ? (
                  <Trans>Help for this condition</Trans>
                ) : (
                  <Trans>Help for this action</Trans>
                )
              }
            />,
          ]}
          open={open}
          onRequestClose={onCancel}
          maxWidth={false}
          noMargin
          flexRowBody
        >
          <SelectColumns
            columnsRenderer={{
              'instruction-or-object-selector': renderInstructionOrObjectSelector,
              'object-instruction-selector': renderObjectInstructionSelector,
              parameters: renderParameters,
            }}
            getColumns={() => {
              if (width === 'large') {
                if (chosenObjectName) {
                  return [
                    'instruction-or-object-selector',
                    'object-instruction-selector',
                    'parameters',
                  ];
                } else {
                  return ['instruction-or-object-selector', 'parameters'];
                }
              } else if (width === 'medium') {
                if (step === 'object-or-free-instructions') {
                  return ['instruction-or-object-selector'];
                } else {
                  if (chosenObjectName) {
                    return ['object-instruction-selector', 'parameters'];
                  } else {
                    return ['parameters'];
                  }
                }
              } else {
                if (step === 'object-or-free-instructions') {
                  return ['instruction-or-object-selector'];
                } else if (step === 'object-instructions') {
                  return ['object-instruction-selector'];
                } else {
                  return ['parameters'];
                }
              }
            }}
          />
        </Dialog>
      )}
    </ResponsiveWidthMeasurer>
  );
}
