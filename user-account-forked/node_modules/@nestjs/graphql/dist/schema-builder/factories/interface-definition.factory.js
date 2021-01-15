"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterfaceDefinitionFactory = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const graphql_1 = require("graphql");
const return_type_cannot_be_resolved_error_1 = require("../errors/return-type-cannot-be-resolved.error");
const orphaned_reference_registry_1 = require("../services/orphaned-reference.registry");
const type_fields_accessor_1 = require("../services/type-fields.accessor");
const type_definitions_storage_1 = require("../storages/type-definitions.storage");
const type_metadata_storage_1 = require("../storages/type-metadata.storage");
const get_interfaces_array_util_1 = require("../utils/get-interfaces-array.util");
const args_factory_1 = require("./args.factory");
const output_type_factory_1 = require("./output-type.factory");
const resolve_type_factory_1 = require("./resolve-type.factory");
let InterfaceDefinitionFactory = class InterfaceDefinitionFactory {
    constructor(resolveTypeFactory, typeDefinitionsStorage, outputTypeFactory, orphanedReferenceRegistry, typeFieldsAccessor, argsFactory) {
        this.resolveTypeFactory = resolveTypeFactory;
        this.typeDefinitionsStorage = typeDefinitionsStorage;
        this.outputTypeFactory = outputTypeFactory;
        this.orphanedReferenceRegistry = orphanedReferenceRegistry;
        this.typeFieldsAccessor = typeFieldsAccessor;
        this.argsFactory = argsFactory;
    }
    create(metadata, options) {
        const resolveType = this.createResolveTypeFn(metadata);
        return {
            target: metadata.target,
            isAbstract: metadata.isAbstract || false,
            type: new graphql_1.GraphQLInterfaceType({
                name: metadata.name,
                description: metadata.description,
                fields: this.generateFields(metadata, options),
                resolveType,
            }),
        };
    }
    createResolveTypeFn(metadata) {
        const objectTypesMetadata = type_metadata_storage_1.TypeMetadataStorage.getObjectTypesMetadata();
        const implementedTypes = objectTypesMetadata
            .filter((objectType) => {
            const interfaces = get_interfaces_array_util_1.getInterfacesArray(objectType.interfaces);
            return interfaces.includes(metadata.target);
        })
            .map((objectType) => objectType.target);
        return metadata.resolveType
            ? this.resolveTypeFactory.getResolveTypeFunction(metadata.resolveType)
            : (instance) => {
                const target = implementedTypes.find((Type) => instance instanceof Type);
                if (!target) {
                    throw new return_type_cannot_be_resolved_error_1.ReturnTypeCannotBeResolvedError(metadata.name);
                }
                return this.typeDefinitionsStorage.getObjectTypeByTarget(target).type;
            };
    }
    generateFields(metadata, options) {
        const prototype = Object.getPrototypeOf(metadata.target);
        metadata.properties.forEach(({ typeFn }) => this.orphanedReferenceRegistry.addToRegistryIfOrphaned(typeFn()));
        const getParentType = () => {
            const parentTypeDefinition = this.typeDefinitionsStorage.getInterfaceByTarget(prototype);
            return parentTypeDefinition ? parentTypeDefinition.type : undefined;
        };
        return () => {
            let fields = {};
            metadata.properties.forEach((field) => {
                fields[field.schemaName] = {
                    description: field.description,
                    type: this.outputTypeFactory.create(field.name, field.typeFn(), options, field.options),
                    args: this.argsFactory.create(field.methodArgs, options),
                    resolve: (root) => {
                        const value = root[field.name];
                        return typeof value === 'undefined'
                            ? field.options.defaultValue
                            : value;
                    },
                    deprecationReason: field.deprecationReason,
                    extensions: Object.assign({ complexity: field.complexity }, field.extensions),
                };
            });
            if (!shared_utils_1.isUndefined(prototype.prototype)) {
                const parentClassRef = getParentType();
                if (parentClassRef) {
                    const parentFields = this.typeFieldsAccessor.extractFromInterfaceOrObjectType(parentClassRef);
                    fields = Object.assign(Object.assign({}, parentFields), fields);
                }
            }
            return fields;
        };
    }
};
InterfaceDefinitionFactory = tslib_1.__decorate([
    common_1.Injectable(),
    tslib_1.__metadata("design:paramtypes", [resolve_type_factory_1.ResolveTypeFactory,
        type_definitions_storage_1.TypeDefinitionsStorage,
        output_type_factory_1.OutputTypeFactory,
        orphaned_reference_registry_1.OrphanedReferenceRegistry,
        type_fields_accessor_1.TypeFieldsAccessor,
        args_factory_1.ArgsFactory])
], InterfaceDefinitionFactory);
exports.InterfaceDefinitionFactory = InterfaceDefinitionFactory;
