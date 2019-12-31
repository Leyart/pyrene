import { applications } from '../../examples/barData';

const examples = {};

examples.props = {
  data: applications.data,
  error: 'There was an error while loading data.',
  title: 'Top Applications by Volume',
  description: 'A vertical bar chart',
  legend: applications.legend,
};

examples.category = 'Chart';

export default examples;
