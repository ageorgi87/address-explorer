import { GraphQLResolveInfo } from 'graphql';
import { Departement as DepartementModel, Commune as CommuneModel, Voie as VoieModel } from '@prisma/client';
import { GraphQLContext } from './context.js';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

/** Commune française */
export type Commune = {
  __typename?: 'Commune';
  /** Code postal principal */
  codePostal: Scalars['String']['output'];
  /** Département parent */
  departement: Departement;
  /** Code du département */
  departementCode: Scalars['String']['output'];
  /** Nom formaté avec code postal */
  displayName: Scalars['String']['output'];
  /** Code INSEE (identifiant unique) */
  id: Scalars['String']['output'];
  /** Nom de la commune */
  nom: Scalars['String']['output'];
  /** Nombre de voies */
  voieCount: Scalars['Int']['output'];
  /** Liste des voies (max 100) */
  voies: Array<Voie>;
};

/** Département français */
export type Departement = {
  __typename?: 'Departement';
  /** Code du département (ex: 75) */
  code: Scalars['String']['output'];
  /** Nombre de communes */
  communeCount: Scalars['Int']['output'];
  /** Liste des communes */
  communes: Array<Commune>;
  /** Nom formaté (ex: 75 - Paris) */
  displayName: Scalars['String']['output'];
  /** Nom officiel */
  nom: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  /** Une commune par son code INSEE */
  commune: Maybe<Commune>;
  /** Communes d'un département */
  communesByDepartement: Array<Commune>;
  /** Un département par son code */
  departement: Maybe<Departement>;
  /** Liste de tous les départements */
  departements: Array<Departement>;
  /** Message de bienvenue */
  hello: Scalars['String']['output'];
  /** Heure du serveur (ISO 8601) */
  serverTime: Scalars['String']['output'];
};


export type QueryCommuneArgs = {
  id: Scalars['String']['input'];
};


export type QueryCommunesByDepartementArgs = {
  departementCode: Scalars['String']['input'];
};


export type QueryDepartementArgs = {
  code: Scalars['String']['input'];
};

/** Voie (rue, avenue, etc.) */
export type Voie = {
  __typename?: 'Voie';
  /** Commune parente */
  commune: Commune;
  /** Identifiant unique */
  id: Scalars['String']['output'];
  /** Nom de la voie */
  nom: Scalars['String']['output'];
};

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = Record<PropertyKey, never>, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;





/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  Commune: ResolverTypeWrapper<CommuneModel>;
  Departement: ResolverTypeWrapper<DepartementModel>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Voie: ResolverTypeWrapper<VoieModel>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  Boolean: Scalars['Boolean']['output'];
  Commune: CommuneModel;
  Departement: DepartementModel;
  Int: Scalars['Int']['output'];
  Query: Record<PropertyKey, never>;
  String: Scalars['String']['output'];
  Voie: VoieModel;
}>;

export type CommuneResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Commune'] = ResolversParentTypes['Commune']> = ResolversObject<{
  codePostal?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  departement?: Resolver<ResolversTypes['Departement'], ParentType, ContextType>;
  departementCode?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  displayName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  nom?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  voieCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  voies?: Resolver<Array<ResolversTypes['Voie']>, ParentType, ContextType>;
}>;

export type DepartementResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Departement'] = ResolversParentTypes['Departement']> = ResolversObject<{
  code?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  communeCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  communes?: Resolver<Array<ResolversTypes['Commune']>, ParentType, ContextType>;
  displayName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  nom?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
}>;

export type QueryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  commune?: Resolver<Maybe<ResolversTypes['Commune']>, ParentType, ContextType, RequireFields<QueryCommuneArgs, 'id'>>;
  communesByDepartement?: Resolver<Array<ResolversTypes['Commune']>, ParentType, ContextType, RequireFields<QueryCommunesByDepartementArgs, 'departementCode'>>;
  departement?: Resolver<Maybe<ResolversTypes['Departement']>, ParentType, ContextType, RequireFields<QueryDepartementArgs, 'code'>>;
  departements?: Resolver<Array<ResolversTypes['Departement']>, ParentType, ContextType>;
  hello?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  serverTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
}>;

export type VoieResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Voie'] = ResolversParentTypes['Voie']> = ResolversObject<{
  commune?: Resolver<ResolversTypes['Commune'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  nom?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
}>;

export type Resolvers<ContextType = GraphQLContext> = ResolversObject<{
  Commune?: CommuneResolvers<ContextType>;
  Departement?: DepartementResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Voie?: VoieResolvers<ContextType>;
}>;

