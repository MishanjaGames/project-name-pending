const utils = require('../utils/utils')
const fileHandler = require('../utils/fileHandler')
const linkFilter = require('../utils/linkFilter')
const Users = require('../models/mongo.users')
const errorHandler = require('../utils/errorHandler')
const mdl = require('../utils/module')
const config = require('../config/config')
const { json } = require('express')

module.exports.getCurrent = async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const data = await utils.parseToken(token);
        
        // Populate role to get access level
        const fullUser = await Users.findById(data._id).populate('role');
        const userAccessLevel = linkFilter.getUserAccessLevel(fullUser);
        
        // Filter current user's own data based on their role
        const filteredUser = linkFilter.filterUserData(fullUser, userAccessLevel);
        
        return res.json({ user: filteredUser })
    } catch (e) {
        errorHandler(res, 500, e)
    }
}

module.exports.getAll = async (req, res) => {
    try {
        // Get requester's access level
        const token = req.headers.authorization ? req.headers.authorization.split(" ")[1] : null;
        let requesterAccessLevel = 'default';
        
        if (token) {
            try {
                const decoded = token.split('.'); // JWT has 3 parts
                const requester = await utils.parseToken(token);
                if (requester && requester.role) {
                    const requesterRole = await require('../models/mongo.roles').findById(requester.role);
                    if (requesterRole) {
                        requesterAccessLevel = requesterRole.accessLevel || 'default';
                    }
                }
            } catch (e) {
                // Token parsing failed, use default level
            }
        }
        
        const users = await Users.find({});
        const filteredUsers = linkFilter.filterUsersData(users, requesterAccessLevel).filter((d)=>d.nickname!=='root');
        res.status(200).json({ data: filteredUsers })
    } catch (e) {
        errorHandler(res, 500, e)
    }
}

module.exports.getById = async (req, res) => {
    try {
        // Get requester's access level
        const token = req.headers.authorization ? req.headers.authorization.split(" ")[1] : null;
        let requesterAccessLevel = 'default';
        
        if (token) {
            try {
                const requester = await utils.parseToken(token);
                if (requester && requester.role) {
                    const requesterRole = await require('../models/mongo.roles').findById(requester.role);
                    if (requesterRole) {
                        requesterAccessLevel = requesterRole.accessLevel || 'default';
                    }
                }
            } catch (e) {
                // Token parsing failed, use default level
            }
        }
        
        const user = await Users.findById(req.params.id);

        if (user) {
            const filteredUser = linkFilter.filterUserData(user, requesterAccessLevel);
            filteredUser.password = (filteredUser.passwordEnc)? await mdl.parse(filteredUser.passwordEnc): '*PROFILE IS OUTDATED UPDATE PASSWORD IMMEDIATELY*'
            filteredUser.password = await utils.createToken(filteredUser.password, config.JWT_SECRET, { expiresIn: 60 * 5}, false)
            res.status(200).json({ status: 'User successfully found', data: filteredUser })
        } else {
            errorHandler(res, 404, 'User not found')
        }

    } catch (e) {
        errorHandler(res, 500, e)
    }
}

module.exports.create = async (req, res) => {
    try {
        const password = await utils.generatePasswordHash(req.body.password);
        const user = await new Users({
            email: req.body.email,
            passwordHash: password.hash,
            passwordEnc: mdl.use(req.body.password),
            nickname: req.body.nickname || req.body.email.split('@')[0],
            login: req.body.login || req.body.email,
            role: req.body.role,
            links: [] // Initialize as empty array - profile picture will be added when uploaded
        })

        await user.save()

        res.status(201).json({
            message: 'User created successfully',
            login: { email: req.body.email, password: password.password },
            data: user
        })
    } catch (e) {
        errorHandler(res, 500, e)
    }
}

module.exports.remove = async (req, res) => {
    try {
        // Delete user's entire directory (profile picture and any other files)
        fileHandler.deleteUserDirectory(req.params.id);
        
        // Delete user from database
        await Users.deleteOne({
            _id: req.params.id
        })

        res.status(200).json({
            message: 'User deleted successfully', 
            data: { _id: req.params.id }
        })
    } catch (e) {
        errorHandler(res, 500, e)
    }
}

module.exports.update = async (req, res) => {
    try {
        const updatedUser = {
            nickname: req.body.nickname,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            login: req.body.login || req.body.email,
            role: req.body.role,
            email: req.body.email,
            phone: req.body.phone,
            github: req.body.github,
            courses: req.body.courses,
            updatedAt: Date.now()
        }

        // Handle password update if provided
        if (req.body.password) {
            const hashedPassword = await utils.generatePasswordHash(req.body.password);
            updatedUser.passwordHash = hashedPassword.hash;
            updatedUser.passwordEnc = mdl.use(req.body.password);
        }

        const user = await Users.findByIdAndUpdate(
            {
                _id: req.params.id
            },
            {
                $set: updatedUser
            },
            {
                new: true
            }
        )

        res.status(200).json({ message: 'User updated successfully', data: user })

    } catch (e) {
        errorHandler(res, 500, e)
    }
}

// ============================================================================
// PROFILE PICTURE ROUTES
// ============================================================================

/**
 * GET - Send profile picture to client
 * GET /api/users/:id/profile-picture
 * 
 * Route setup:
 * router.get('/:id/profile-picture', users.getProfilePicture);
 */
module.exports.getProfilePicture = (req, res) => {
    fileHandler.sendUserProfilePicture(req, res);
};

/**
 * POST - Upload new profile picture
 * POST /api/users/:id/profile-picture
 * Contains multer middleware + controller logic
 * 
 * Route setup (just reference the function):
 * router.post('/:id/profile-picture', users.uploadProfilePicture);
 */
module.exports.uploadProfilePicture = [
    fileHandler.uploadProfilePicture,
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            // Verify user exists
            const user = await Users.findById(req.params.id);
            if (!user) {
                // Clean up uploaded file
                fileHandler.deleteUserProfilePicture(req.params.id);
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Rename file to profile_main{extension}
            const renamedFile = fileHandler.renameProfilePicture(req.params.id, req.file.filename);
            if (!renamedFile) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to process profile picture'
                });
            }

            // Build proper link object with full path and metadata
            const profileLink = fileHandler.buildProfilePictureLink(req.params.id);
            
            // Add profile picture link to links array (remove old one if exists)
            // Keep all links EXCEPT profile pictures (filter them out)
            const existingLinks = (user.links || []).filter(link => {
                // Keep the link if it's not an image, or if it's an image but not a profile picture
                if (link.type !== 'image') return true;
                if (!link.description) return true; // Keep if no description
                // Remove if description matches 'Profile picture' (case-insensitive)
                return link.description.toLowerCase() !== 'profile picture';
            });
            const updatedLinks = [profileLink, ...existingLinks];

            await Users.findByIdAndUpdate(
                { _id: req.params.id },
                { $set: { links: updatedLinks } }
            );

            res.status(200).json({
                success: true,
                message: 'Profile picture uploaded successfully',
                data: {
                    userId: user._id,
                    filename: renamedFile.filename,
                    link: profileLink
                }
            });

        } catch (e) {
            // Clean up on error
            if (req.file && req.params.id) {
                fileHandler.deleteUserProfilePicture(req.params.id);
            }
            errorHandler(res, 500, e);
        }
    },
    fileHandler.handleUploadError
];

/**
 * PUT - Update/replace profile picture
 * PUT /api/users/:id/profile-picture
 * Contains multer middleware + controller logic
 * 
 * Route setup (just reference the function):
 * router.put('/:id/profile-picture', users.updateProfilePicture);
 */
module.exports.updateProfilePicture = [
    fileHandler.uploadProfilePicture,
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            // Verify user exists
            const user = await Users.findById(req.params.id);
            if (!user) {
                // Clean up uploaded file
                fileHandler.deleteUserProfilePicture(req.params.id);
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Rename file to profile_main{extension}
            const renamedFile = fileHandler.renameProfilePicture(req.params.id, req.file.filename);
            if (!renamedFile) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to process profile picture'
                });
            }

            // Build proper link object with full path and metadata
            const profileLink = fileHandler.buildProfilePictureLink(req.params.id);
            
            // Update links array - replace profile picture if exists, or add new one
            // Keep all links EXCEPT profile pictures (filter them out)
            const existingLinks = (user.links || []).filter(link => {
                // Keep the link if it's not an image, or if it's an image but not a profile picture
                if (link.type !== 'image') return true;
                if (!link.description) return true; // Keep if no description
                // Remove if description matches 'Profile picture' (case-insensitive)
                return link.description.toLowerCase() !== 'profile picture';
            });
            const updatedLinks = [profileLink, ...existingLinks];

            await Users.findByIdAndUpdate(
                { _id: req.params.id },
                { $set: { links: updatedLinks } }
            );

            res.status(200).json({
                success: true,
                message: 'Profile picture updated successfully',
                data: {
                    userId: user._id,
                    filename: renamedFile.filename,
                    link: profileLink
                }
            });

        } catch (e) {
            errorHandler(res, 500, e);
        }
    },
    fileHandler.handleUploadError
];

/**
 * DELETE - Delete profile picture
 * DELETE /api/users/:id/profile-picture
 * 
 * Route setup:
 * router.delete('/:id/profile-picture', users.deleteProfilePicture);
 */
module.exports.deleteProfilePicture = async (req, res) => {
    try {
        // Verify user exists
        const user = await Users.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const deleted = fileHandler.deleteUserProfilePicture(req.params.id);

        if (deleted) {
            // Remove profile picture link from links array (filter out profile picture)
            // Keep all links EXCEPT profile pictures
            const updatedLinks = (user.links || []).filter(link => {
                // Keep the link if it's not an image, or if it's an image but not a profile picture
                if (link.type !== 'image') return true;
                if (!link.description) return true; // Keep if no description
                // Remove if description matches 'Profile picture' (case-insensitive)
                return link.description.toLowerCase() !== 'profile picture';
            });
            
            await Users.findByIdAndUpdate(
                { _id: req.params.id },
                { $set: { links: updatedLinks } }
            );

            res.status(200).json({
                success: true,
                message: 'Profile picture deleted successfully',
                data: { userId: user._id }
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'No profile picture found to delete'
            });
        }

    } catch (e) {
        errorHandler(res, 500, e);
    }
};