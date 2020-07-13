import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { FaSpinner, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import api from '../../services/api';
import { Loading, Owner, IssueList, Pagination } from './styles';
import Container from '../../Components/Container';

export default class Repository extends Component {
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repository: PropTypes.string,
      }),
    }).isRequired,
  };

  state = {
    repository: {},
    issues: [],
    loading: true,
    filters: [
      { value: 'all', label: 'Todas', selected: true },
      { value: 'open', label: 'Abertas', selected: false },
      { value: 'closed', label: 'Fechadas', selected: false },
    ],
    filterUsed: 'all',
    page: 1,
  };

  async componentDidMount() {
    const { match } = this.props;
    const { filterUsed, page } = this.state;
    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: filterUsed,
          per_page: 5,
          page,
        },
      }),
    ]); // faz os dois request ao mesmo tempo, e espera as duas terminarem pra seguir
    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
    });
  }

  loadIssues = async () => {
    const { match } = this.props;
    const { filterUsed, page } = this.state;

    const repoName = decodeURIComponent(match.params.repository);

    const response = await api.get(`/repos/${repoName}/issues`, {
      params: {
        state: filterUsed,
        per_page: 5,
        page,
      },
    });

    this.setState({ issues: response.data });
  };

  handleFilterChange = async filterUsed => {
    await this.setState({ filterUsed, page: 1 });
    this.loadIssues();
  };

  handlePage = async page => {
    if (page > 0) {
      await this.setState({ page });
      this.loadIssues();
    }
  };

  render() {
    const { repository, issues, loading, filters, page } = this.state;
    if (loading) {
      return <Loading>Carregando</Loading>;
    }

    return (
      <Container>
        <Owner>
          <Link to="/">Voltar aos repositorios</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
          <select onChange={e => this.handleFilterChange(e.target.value)}>
            {filters.map(filter => (
              <option
                // selected={filter.selected}
                value={filter.value}
                key={filter.label}
              >
                {filter.label}
              </option>
            ))}
          </select>
        </Owner>
        <IssueList>
          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>
                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
        </IssueList>

        <Pagination>
          <FaArrowLeft
            disabled={page === 1}
            onClick={() => this.handlePage(page - 1)}
          />
          <p>Pagina {page}</p>
          <FaArrowRight onClick={() => this.handlePage(page + 1)} />
        </Pagination>
      </Container>
    );
  }
}
