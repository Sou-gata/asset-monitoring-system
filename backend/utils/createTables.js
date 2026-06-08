const pool = require("./dbConnect");

async function createTenantTables(tenantId) {
    await createUserTable(tenantId);
    await createEmployeeTable(tenantId);
    await createAssetTable(tenantId);
    await createTaggingTable(tenantId);
    await createHistoryTables(tenantId);
}

async function createUserTable(tenantId) {
    const tableName = `users_${tenantId}`;
    const query = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
            id INT AUTO_INCREMENT,
            name VARCHAR(255) NOT NULL,
            display_username VARCHAR(255) NOT NULL UNIQUE,
            username VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            email VARCHAR(255) DEFAULT NULL,
            contact VARCHAR(20) DEFAULT NULL,
            role ENUM('admin', 'user') NOT NULL,
            seassion_id VARCHAR(255) DEFAULT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        )
    `;
    try {
        await pool.query(query);
        console.log(`Table ${tableName} created successfully`);
    } catch (error) {
        console.error(`Error creating table ${tableName}:`, error.message);
    }
}

async function createEmployeeTable(tenantId) {
    const tableName = `employees_${tenantId}`;
    const query = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
            id INT AUTO_INCREMENT,
            emp_code VARCHAR(255) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            status ENUM('active', 'inactive') DEFAULT 'active',
            PRIMARY KEY (id)
        )
    `;
    try {
        await pool.query(query);
        console.log(`Table ${tableName} created successfully`);
    } catch (error) {
        console.error(`Error creating table ${tableName}:`, error.message);
    }
}

async function createAssetTable(tenantId) {
    const tableName = `assets_${tenantId}`;
    const query = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
            id INT AUTO_INCREMENT,
            asset_id VARCHAR(255) NOT NULL UNIQUE,
            serial VARCHAR(255) UNIQUE DEFAULT NULL,
            type VARCHAR(255) NOT NULL,
            model_no VARCHAR(255) DEFAULT NULL,
            status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
            location VARCHAR(255) DEFAULT NULL,
            exp_date DATETIME DEFAULT NULL,
            remarks TEXT,
            PRIMARY KEY (id)
        )
    `;

    try {
        await pool.query(query);
        console.log(`Table ${tableName} created successfully`);
    } catch (error) {
        console.error(`Error creating table ${tableName}:`, error.message);
    }
}

async function createTaggingTable(tenantId) {
    const tableName = `taggings_${tenantId}`;
    const query = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
            id INT AUTO_INCREMENT,
            asset_id INT NOT NULL UNIQUE,
            employee_id INT NOT NULL UNIQUE,
            assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            detagged_at DATETIME DEFAULT NULL,
            assigned_submission DATETIME DEFAULT NULL,
            PRIMARY KEY (id),
            FOREIGN KEY (asset_id) REFERENCES assets_${tenantId}(id) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (employee_id) REFERENCES employees_${tenantId}(id) ON DELETE CASCADE ON UPDATE CASCADE
        )
    `;
    try {
        await pool.query(query);
        console.log(`Table ${tableName} created successfully`);
    } catch (error) {
        console.error(`Error creating table ${tableName}:`, error.message);
    }
}

async function createHistoryTables(tenantId) {
    const tableName = `history_${tenantId}`;
    const query = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
            id INT AUTO_INCREMENT,
            asset_id INT NOT NULL,
            employee_id INT NOT NULL,
            assigned_at DATETIME DEFAULT NULL,
            detagged_at DATETIME DEFAULT NULL,
            PRIMARY KEY (id),
            FOREIGN KEY (asset_id) REFERENCES assets_${tenantId}(id) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (employee_id) REFERENCES employees_${tenantId}(id) ON DELETE CASCADE ON UPDATE CASCADE
        )
    `;
    try {
        await pool.query(query);
        console.log(`Table ${tableName} created successfully`);
    } catch (error) {
        console.error(`Error creating table ${tableName}:`, error.message);
    }
}

async function createChildAssetTable(tenantId) {
    const tableName = `child_assets_${tenantId}`;
    const query = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
            id INT AUTO_INCREMENT,
            asset_id INT NOT NULL,
            child_asset_id INT NOT NULL,
            created_at DATETIME NOT NULL,
            remove_at DATETIME DEFAULT NULL,
            PRIMARY KEY (id),
            FOREIGN KEY (asset_id) REFERENCES assets_${tenantId}(id) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (child_asset_id) REFERENCES assets_${tenantId}(id) ON DELETE CASCADE ON UPDATE CASCADE
        );
    `;
    try {
        await pool.query(query);
        console.log(`Table ${tableName} created successfully`);
    } catch (error) {
        console.error(`Error creating table ${tableName}:`, error.message);
    }
}

// CREATE TABLE `asset_monitoring`.`config_a1b2c3d4` ( `id` INT NOT NULL AUTO_INCREMENT ,  `config_key` VARCHAR(50) NOT NULL ,  `value` VARCHAR(250) NOT NULL ,    PRIMARY KEY  (`id`)) ENGINE = InnoDB;

module.exports = {
    createTenantTables,
    createUserTable,
    createEmployeeTable,
    createAssetTable,
    createTaggingTable,
    createHistoryTables,
    createChildAssetTable,
};
