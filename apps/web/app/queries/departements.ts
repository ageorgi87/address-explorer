import { gql } from 'graphql-tag'

export interface Departement {
  code: string
  nom: string
  communeCount: number
}

export interface DepartementsData {
  departements: Departement[]
}

export const DEPARTEMENTS_QUERY = gql`
  query Departements {
    departements {
      code
      nom
      communeCount
    }
  }
`
