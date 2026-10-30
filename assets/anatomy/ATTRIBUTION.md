# Anatomical geometry source

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.

- Dataset: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
- Current source license, updated 2025-02-27: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html
- License: https://creativecommons.org/licenses/by/4.0/
- Source: BodyParts3D 4.0 PART-OF tree OBJ archive, 99% polygon reduction.
- Selected concepts: left cerebral hemisphere FMA61819 and right cerebral hemisphere FMA67292, using their constituent meshes from the source mapping table.

Adaptation: sample 32,768 points per hemisphere by triangle surface area, then translate and uniformly scale the coordinates. Preserve anatomical geometry rather than synthesize folds. The source archive, mapping tables, saved license page, extraction script, exact mesh IDs and checksums accompany the derived point cloud.

For the instrument, reorder each hemisphere with balanced spatial partitions: eight contiguous groups of 4,096 points, then compact 32-point rings within each group. The positions are unchanged by this reordering. Per-point normals come from their sampled source triangles. Both coordinate and normal buffers contain exactly 65,536 little-endian float32 triples.

The 16 musical regions, coupling, excitation colors and rhythm are instrument design layers. They do not represent measured neural activity or the source atlas's anatomical parcellation. This cerebral-hemisphere asset omits the cerebellum and brainstem. The source model is an anatomical reference, not a new patient reconstruction.

The AI-generated concept image is a design visualization informed by the source point-cloud reference; the coordinate asset and deterministic reference render are the exact geometry evidence. The concept image itself must not be described as a validated medical rendering.
