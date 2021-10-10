import React from 'react';
import Layout from '@theme/Layout';
import PlaygroundComponent from '../components/PlaygroundComponent/PlaygroundComponent.js';

export default function Home() {
  return (
    <Layout
      title={`Playground`}
      description="Description will go into a meta tag in <head />">
      <main>
        <PlaygroundComponent />
      </main>
    </Layout>
  );
}