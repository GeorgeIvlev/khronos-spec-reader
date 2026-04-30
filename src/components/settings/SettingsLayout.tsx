// import { useEffect, useState, useMemo, memo } from 'react'
// import { useForm, FormProvider } from 'react-hook-form'
// import { Group, Tree, useTree, Input, Button } from '@mantine/core'

import { execCommand } from '@services/CommandManager';

import './styles.scss';

const settingsData = [
  {
    label: 'Build tools',
    value: 'build-tools',
  },
  {
    label: 'Version Control',
    value: 'version-control',
  },
  {
    label: 'Code Analysis',
    value: 'code-analysis',
    // children: [{ value: 'clang-tidy' }, { value: 'clang-format' }],
  },
];

const settingsForms = {
  'build-tools': {
    items: [
      {
        type: 'input',
        key: 'cmake',
        value: '',
      },
      {
        type: 'input',
        key: 'meson',
        value: '',
      },
    ],
  },
  'version-control': {
    items: [],
  },
  'code-analysis': {
    items: [],
  },
};

const FormBuilder = memo(({ formKey }: { formKey: string }) => {
  const methods = useForm();

  const formRenderItems: JSX.Element[] = [];

  settingsForms[formKey]?.items.forEach((item) => {
    switch (item.type) {
      case 'input': {
        formRenderItems.push(
          <Input key={item.key} {...methods.register(item.key, { required: true })} />,
        );
        break;
      }
      default: {
        break;
      }
    }
  });

  return (
    <FormProvider {...methods}>
      <form
        className="form"
        onSubmit={methods.handleSubmit((data) => {
          console.log(data);
          console.log('settingsForms: ', settingsForms);
        })}
      >
        {formRenderItems}
        <div>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </FormProvider>
  );
});

const SettingsLayout = () => {
  const tree = useTree();
  const data = useMemo(async () => {
    // ;['git', 'cmake', 'python3', 'meson', 'clang', 'clang++'].forEach(
    //   async (app) => {
    //     console.log('#', app

    try {
      const app = 'cmake';
      const { exitCode } = await execCommand(`where cmake`, {
        onStdout: (line) => console.log(line),
        onStderr: (line) => console.log(line),
      });
      console.log('exitCode: ', exitCode);
    } catch (e) {
      console.log('ERROR: ', e);
    }

    return {};
  }, []);

  const selected = tree.selectedState[0] as string;

  return (
    <div style={{ padding: '8px' }}>
      <h1>Settings</h1>
      <div className="flex column">
        <Tree
          style={{ overflow: 'hidden', flexBasis: '20%' }}
          data={settingsData}
          tree={tree}
          selectOnClick
          renderNode={({ node, expanded, hasChildren, elementProps }) => (
            <Group gap={5} {...elementProps}>
              <span>{node.value || ''}</span>
            </Group>
          )}
        />
        <div style={{ flexBasis: '100%' }}>
          <FormBuilder formKey={selected} />
        </div>
      </div>
    </div>
  );
};

export default SettingsLayout;
