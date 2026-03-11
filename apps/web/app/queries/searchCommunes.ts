import { gql } from 'graphql-tag'

export interface CommuneSearchResult {
  id: string
  nom: string
  codePostal: string
  departement: {
    code: string
    nom: string
  }
}

export interface SearchCommunesData {
  searchCommunes: CommuneSearchResult[]
}

export const SEARCH_COMMUNES_QUERY = gql`
  query SearchCommunes($search: String!, $first: Int) {
    searchCommunes(search: $search, first: $first) {
      id
      nom
      codePostal
      departement {
        code
        nom
      }
    }
  }
`
